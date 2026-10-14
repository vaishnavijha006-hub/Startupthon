-- =============================================================================
-- Migration: 20261014000002_prevent_duplicate_roll_numbers.sql
-- Description: Adds database-level duplicate roll-number prevention and
--              updates public.submit_registration_internal(JSONB) with
--              intra-team Duo checks, cross-registration duplicate checks,
--              and concurrency-safe unique violation handling.
--
-- ARCHITECTURAL RATIONALE:
-- 1. PARTIAL EXPRESSION UNIQUE INDEX:
--    - Table: public.participants
--    - Index: (trim(roll_number)) WHERE roll_number IS NOT NULL AND trim(roll_number) <> ''
--    - Why Partial & Expression: First-year students are not yet assigned a university roll
--      number, so roll_number is legitimately NULL for those participants.
--      Standard UNIQUE indexes in Postgres allow multiple NULLs, but an expression
--      unique index on trim(roll_number) ensures that whitespace variations cannot
--      bypass uniqueness, while the partial predicate ignores NULL and empty strings.
--
-- 2. REDUNDANT INDEX JUSTIFICATION (OMISSION OF (registration_id, roll_number)):
--    - A table-wide unique index on (trim(roll_number))
--      already guarantees that a roll number can exist at most once across the
--      entire public.participants table.
--    - Because a roll number cannot appear more than once in the table globally,
--      it is mathematically impossible for it to appear more than once within
--      the same registration.
--    - Therefore, a composite unique index on (registration_id, roll_number) is
--      redundant, would consume duplicate storage, and is intentionally omitted.
--
-- 3. INTRA-TEAM DUO VALIDATION:
--    - In Duo registrations, Member 1 and Member 2 must be distinct individuals.
--    - The RPC validates that non-null roll numbers and normalized emails
--      do not match between teammates before performing any database write.
--    - Legitimate shared phone numbers (e.g. guardian contact) are NOT rejected.
--
-- 4. CONCURRENT RACE-CONDITION SAFETY:
--    - In addition to an explicit pre-insert EXISTS check, the participant insert
--      is wrapped in an EXCEPTION block catching unique_violation (SQLSTATE 23505).
--    - If two concurrent requests race with the same roll number, the database
--      unique index stops the second request, and the RPC converts the constraint
--      violation into a safe, human-readable exception (code P0001) without
--      exposing internal schema or table details.
--    - The entire multi-table transaction rolls back automatically on error.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- STEP 1: PRE-CHECK EXISTING DATA FOR NORMALIZED DUPLICATE ROLL NUMBERS
-- -----------------------------------------------------------------------------
-- Detect duplicate nonblank roll numbers after trimming whitespace.
-- If legacy records already contain normalized duplicates, abort with a clear
-- exception before creating the index, without updating or deleting any records.
DO $$
DECLARE
    v_duplicate_count INT;
    v_sample_duplicate TEXT;
BEGIN
    SELECT COUNT(*), MIN(trimmed_roll)
    INTO v_duplicate_count, v_sample_duplicate
    FROM (
        SELECT trim(roll_number) AS trimmed_roll
        FROM public.participants
        WHERE roll_number IS NOT NULL AND trim(roll_number) <> ''
        GROUP BY trim(roll_number)
        HAVING COUNT(*) > 1
    ) dup_records;

    IF v_duplicate_count > 0 THEN
        RAISE EXCEPTION 'Cannot create unique index: found % duplicate roll number(s) in public.participants (example: "%"). Please resolve existing duplicates before applying this migration.',
            v_duplicate_count, v_sample_duplicate;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- STEP 2: CREATE PARTIAL EXPRESSION UNIQUE INDEX ON NORMALIZED ROLL NUMBERS
-- -----------------------------------------------------------------------------
-- Safely drop existing index if it was previously created on the raw column,
-- ensuring rerun safety and upgrading to the normalized expression index.
DROP INDEX IF EXISTS public.participants_roll_number_unique_idx;

CREATE UNIQUE INDEX participants_roll_number_unique_idx
ON public.participants (trim(roll_number))
WHERE roll_number IS NOT NULL AND trim(roll_number) <> '';

-- -----------------------------------------------------------------------------
-- STEP 3: UPDATE REGISTRATION RPC WITH ENHANCED INTEGRITY CONTROLS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_registration_internal(
    p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    -- Request level variables
    v_team_type TEXT;
    v_participants JSONB;
    v_participant_count INT;
    v_idea JSONB;

    -- Startup idea variables
    v_idea_title TEXT;
    v_idea_desc TEXT;
    v_domain TEXT;
    v_prototype_avail BOOLEAN;
    v_sketch_path TEXT;

    -- Participant iteration variables
    v_idx INT;
    v_p JSONB;
    v_full_name TEXT;
    v_academic_year TEXT;
    v_section TEXT;
    v_roll_raw TEXT;
    v_roll TEXT;
    v_phone TEXT;
    v_phone_digits TEXT;
    v_email TEXT;

    -- Duo duplicate check variables
    v_p0_roll TEXT;
    v_p1_roll TEXT;
    v_p0_email TEXT;
    v_p1_email TEXT;

    -- Generated registration records
    v_registration_id UUID;
    v_registration_number BIGINT;
    v_created_at TIMESTAMPTZ;
BEGIN
    -- -------------------------------------------------------------------------
    -- 1. ROOT PAYLOAD TYPE & NULL CHECKS
    -- -------------------------------------------------------------------------
    IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
        RAISE EXCEPTION 'Payload must be a non-null JSON object';
    END IF;

    -- -------------------------------------------------------------------------
    -- 2. TEAM TYPE VALIDATION
    -- -------------------------------------------------------------------------
    IF jsonb_typeof(p_payload->'teamType') <> 'string' THEN
        RAISE EXCEPTION 'Field teamType is required and must be a string';
    END IF;

    v_team_type := trim(p_payload->>'teamType');
    IF v_team_type NOT IN ('solo', 'duo') THEN
        RAISE EXCEPTION 'Field teamType must be either "solo" or "duo"';
    END IF;

    -- -------------------------------------------------------------------------
    -- 3. PARTICIPANTS ARRAY & DUO INTRA-TEAM INTEGRITY CHECKS
    -- -------------------------------------------------------------------------
    v_participants := p_payload->'participants';
    IF v_participants IS NULL OR jsonb_typeof(v_participants) <> 'array' THEN
        RAISE EXCEPTION 'Field participants is required and must be a JSON array';
    END IF;

    v_participant_count := jsonb_array_length(v_participants);
    IF v_team_type = 'solo' AND v_participant_count <> 1 THEN
        RAISE EXCEPTION 'Solo registrations must contain exactly 1 participant (received %)', v_participant_count;
    END IF;
    IF v_team_type = 'duo' AND v_participant_count <> 2 THEN
        RAISE EXCEPTION 'Duo registrations must contain exactly 2 participants (received %)', v_participant_count;
    END IF;

    -- If Duo, enforce that both team members are distinct individuals
    IF v_team_type = 'duo' THEN
        IF jsonb_typeof(v_participants->0) <> 'object' OR jsonb_typeof(v_participants->1) <> 'object' THEN
            RAISE EXCEPTION 'Duo participants must both be valid JSON objects';
        END IF;

        v_p0_roll := NULLIF(trim(COALESCE(v_participants->0->>'rollNumber', '')), '');
        v_p1_roll := NULLIF(trim(COALESCE(v_participants->1->>'rollNumber', '')), '');
        v_p0_email := lower(trim(COALESCE(v_participants->0->>'email', '')));
        v_p1_email := lower(trim(COALESCE(v_participants->1->>'email', '')));

        -- Reject if both participants provide the same non-null roll number
        IF v_p0_roll IS NOT NULL AND v_p1_roll IS NOT NULL AND v_p0_roll = v_p1_roll THEN
            RAISE EXCEPTION 'Duo participants cannot share the same roll number (%)', v_p0_roll;
        END IF;

        -- Reject if both participants have the same normalized email
        IF v_p0_email <> '' AND v_p0_email = v_p1_email THEN
            RAISE EXCEPTION 'Duo participants cannot share the same email address (%)', v_p0_email;
        END IF;
    END IF;

    -- -------------------------------------------------------------------------
    -- 4. STARTUP IDEA VALIDATION (BEFORE ANY INSERTS)
    -- -------------------------------------------------------------------------
    v_idea := p_payload->'idea';
    IF v_idea IS NULL OR jsonb_typeof(v_idea) <> 'object' THEN
        RAISE EXCEPTION 'Field idea is required and must be a JSON object';
    END IF;

    -- Title validation
    IF jsonb_typeof(v_idea->'title') <> 'string' THEN
        RAISE EXCEPTION 'Idea title is required and must be a string';
    END IF;
    v_idea_title := trim(v_idea->>'title');
    IF length(v_idea_title) < 3 THEN
        RAISE EXCEPTION 'Idea title must be at least 3 characters in length';
    END IF;
    IF length(v_idea_title) > 200 THEN
        RAISE EXCEPTION 'Idea title exceeds maximum length of 200 characters';
    END IF;

    -- Description validation
    IF jsonb_typeof(v_idea->'description') <> 'string' THEN
        RAISE EXCEPTION 'Idea description is required and must be a string';
    END IF;
    v_idea_desc := trim(v_idea->>'description');
    IF length(v_idea_desc) < 10 THEN
        RAISE EXCEPTION 'Idea description must be at least 10 characters in length';
    END IF;
    IF length(v_idea_desc) > 5000 THEN
        RAISE EXCEPTION 'Idea description exceeds maximum length of 5000 characters';
    END IF;

    -- Domain validation
    IF jsonb_typeof(v_idea->'domain') <> 'string' THEN
        RAISE EXCEPTION 'Idea domain is required and must be a string';
    END IF;
    v_domain := trim(v_idea->>'domain');
    IF v_domain NOT IN ('ai', 'healthcare', 'environment', 'fintech', 'other') THEN
        RAISE EXCEPTION 'Invalid domain "%". Must be one of: ai, healthcare, environment, fintech, other', v_domain;
    END IF;

    -- Prototype Available validation (strict JSON boolean)
    IF jsonb_typeof(v_idea->'prototypeAvailable') <> 'boolean' THEN
        RAISE EXCEPTION 'Field prototypeAvailable is required and must be a JSON boolean (true or false)';
    END IF;
    v_prototype_avail := (v_idea->>'prototypeAvailable')::BOOLEAN;

    -- Sketch File Path validation (optional string or null)
    IF v_idea ? 'sketchFilePath' AND jsonb_typeof(v_idea->'sketchFilePath') NOT IN ('string', 'null') THEN
        RAISE EXCEPTION 'Field sketchFilePath must be a string or null';
    END IF;
    v_sketch_path := NULLIF(trim(COALESCE(v_idea->>'sketchFilePath', '')), '');
    IF v_sketch_path IS NOT NULL AND length(v_sketch_path) > 500 THEN
        RAISE EXCEPTION 'Field sketchFilePath exceeds maximum length of 500 characters';
    END IF;

    -- -------------------------------------------------------------------------
    -- 5. PARTICIPANTS DETAILED VALIDATION (BEFORE ANY INSERTS)
    -- -------------------------------------------------------------------------
    FOR v_idx IN 0 .. (v_participant_count - 1) LOOP
        v_p := v_participants->v_idx;

        IF jsonb_typeof(v_p) <> 'object' THEN
            RAISE EXCEPTION 'Participant at index % must be a JSON object', v_idx;
        END IF;

        -- Full Name
        IF jsonb_typeof(v_p->'fullName') <> 'string' THEN
            RAISE EXCEPTION 'Participant [%] full name is required and must be a string', v_idx + 1;
        END IF;
        v_full_name := trim(v_p->>'fullName');
        IF length(v_full_name) < 2 THEN
            RAISE EXCEPTION 'Participant [%] full name must be at least 2 characters', v_idx + 1;
        END IF;
        IF length(v_full_name) > 100 THEN
            RAISE EXCEPTION 'Participant [%] full name exceeds maximum length of 100 characters', v_idx + 1;
        END IF;

        -- Academic Year
        IF jsonb_typeof(v_p->'academicYear') <> 'string' THEN
            RAISE EXCEPTION 'Participant [%] academic year is required and must be a string', v_idx + 1;
        END IF;
        v_academic_year := trim(v_p->>'academicYear');
        IF v_academic_year NOT IN ('1st Year', '2nd Year', '3rd Year', '4th Year') THEN
            RAISE EXCEPTION 'Participant [%] academic year must be 1st Year, 2nd Year, 3rd Year, or 4th Year', v_idx + 1;
        END IF;

        -- Section
        IF jsonb_typeof(v_p->'section') <> 'string' THEN
            RAISE EXCEPTION 'Participant [%] section is required and must be a string', v_idx + 1;
        END IF;
        v_section := trim(v_p->>'section');
        IF length(v_section) < 1 THEN
            RAISE EXCEPTION 'Participant [%] section cannot be empty', v_idx + 1;
        END IF;
        IF length(v_section) > 20 THEN
            RAISE EXCEPTION 'Participant [%] section exceeds maximum length of 20 characters', v_idx + 1;
        END IF;

        -- Roll Number
        IF v_p ? 'rollNumber' AND jsonb_typeof(v_p->'rollNumber') NOT IN ('string', 'null') THEN
            RAISE EXCEPTION 'Participant [%] roll number must be a string or null', v_idx + 1;
        END IF;
        v_roll_raw := COALESCE(v_p->>'rollNumber', '');
        v_roll := NULLIF(trim(v_roll_raw), '');

        -- Enforce Academic-Year Roll Number Rules
        IF v_academic_year = '1st Year' THEN
            -- 1st Year roll number is optional; if provided, must be exactly 13 digits
            IF v_roll IS NOT NULL AND v_roll !~ '^[0-9]{13}$' THEN
                RAISE EXCEPTION 'Participant [%] (1st Year) roll number must be exactly 13 digits if provided', v_idx + 1;
            END IF;
        ELSIF v_academic_year = '2nd Year' THEN
            IF v_roll IS NULL THEN
                RAISE EXCEPTION 'Participant [%] (2nd Year) roll number is required', v_idx + 1;
            END IF;
            IF v_roll !~ '^25[0-9]{11}$' THEN
                RAISE EXCEPTION 'Participant [%] (2nd Year) roll number must be exactly 13 digits starting with 25', v_idx + 1;
            END IF;
        ELSIF v_academic_year = '3rd Year' THEN
            IF v_roll IS NULL THEN
                RAISE EXCEPTION 'Participant [%] (3rd Year) roll number is required', v_idx + 1;
            END IF;
            IF v_roll !~ '^24[0-9]{11}$' THEN
                RAISE EXCEPTION 'Participant [%] (3rd Year) roll number must be exactly 13 digits starting with 24', v_idx + 1;
            END IF;
        ELSIF v_academic_year = '4th Year' THEN
            IF v_roll IS NULL THEN
                RAISE EXCEPTION 'Participant [%] (4th Year) roll number is required', v_idx + 1;
            END IF;
            IF v_roll !~ '^23[0-9]{11}$' THEN
                RAISE EXCEPTION 'Participant [%] (4th Year) roll number must be exactly 13 digits starting with 23', v_idx + 1;
            END IF;
        END IF;

        -- Cross-Registration Duplicate Roll-Number Check
        -- Fast pre-check: verify non-null normalized roll number is not already registered
        IF v_roll IS NOT NULL THEN
            IF EXISTS (
                SELECT 1
                FROM public.participants
                WHERE trim(roll_number) = v_roll
            ) THEN
                RAISE EXCEPTION 'Roll number "%" is already registered', v_roll;
            END IF;
        END IF;

        -- Phone Number Validation
        IF jsonb_typeof(v_p->'phone') <> 'string' THEN
            RAISE EXCEPTION 'Participant [%] phone number is required and must be a string', v_idx + 1;
        END IF;
        v_phone := trim(v_p->>'phone');
        IF v_phone !~ '^[+]?[0-9 -]{10,25}$' THEN
            RAISE EXCEPTION 'Participant [%] phone number contains invalid characters', v_idx + 1;
        END IF;
        v_phone_digits := regexp_replace(v_phone, '[^0-9]', '', 'g');
        IF length(v_phone_digits) < 10 OR length(v_phone_digits) > 15 THEN
            RAISE EXCEPTION 'Participant [%] phone number must contain between 10 and 15 digits (found % digits)', v_idx + 1, length(v_phone_digits);
        END IF;

        -- Email Address Validation
        IF jsonb_typeof(v_p->'email') <> 'string' THEN
            RAISE EXCEPTION 'Participant [%] email address is required and must be a string', v_idx + 1;
        END IF;
        v_email := lower(trim(v_p->>'email'));
        IF length(v_email) > 255 THEN
            RAISE EXCEPTION 'Participant [%] email address exceeds maximum length of 255 characters', v_idx + 1;
        END IF;
        IF v_email !~ '^[a-z0-9._%+-]+@([a-z0-9][-a-z0-9]*\.)+[a-z]{2,}$' THEN
            RAISE EXCEPTION 'Participant [%] email address is invalid', v_idx + 1;
        END IF;
    END LOOP;

    -- -------------------------------------------------------------------------
    -- 6. ATOMIC DATABASE INSERTS
    -- -------------------------------------------------------------------------
    -- Step A: Insert into public.registrations
    INSERT INTO public.registrations (team_type)
    VALUES (v_team_type)
    RETURNING id, registration_number, created_at
    INTO v_registration_id, v_registration_number, v_created_at;

    -- Step B: Insert into public.participants
    -- Wrapped with an EXCEPTION handler to safely trap race conditions where a
    -- concurrent transaction registered the same roll number right after the EXISTS check.
    FOR v_idx IN 0 .. (v_participant_count - 1) LOOP
        v_p := v_participants->v_idx;
        v_academic_year := trim(v_p->>'academicYear');
        v_roll := NULLIF(trim(COALESCE(v_p->>'rollNumber', '')), '');

        BEGIN
            INSERT INTO public.participants (
                registration_id,
                full_name,
                academic_year,
                section,
                roll_number,
                phone,
                email
            ) VALUES (
                v_registration_id,
                trim(v_p->>'fullName'),
                v_academic_year,
                trim(v_p->>'section'),
                v_roll,
                trim(v_p->>'phone'),
                lower(trim(v_p->>'email'))
            );
        EXCEPTION
            WHEN unique_violation THEN
                -- SQLSTATE 23505: converts index violation into a safe user validation message
                RAISE EXCEPTION 'Roll number "%" is already registered', v_roll;
        END;
    END LOOP;

    -- Step C: Insert into public.startup_ideas
    INSERT INTO public.startup_ideas (
        registration_id,
        title,
        description,
        domain,
        prototype_available,
        sketch_file_path
    ) VALUES (
        v_registration_id,
        v_idea_title,
        v_idea_desc,
        v_domain,
        v_prototype_avail,
        v_sketch_path
    );

    -- -------------------------------------------------------------------------
    -- 7. RETURN SUCCESS RESPONSE
    -- -------------------------------------------------------------------------
    RETURN jsonb_build_object(
        'success', true,
        'registrationId', v_registration_id,
        'registrationNumber', v_registration_number,
        'teamType', v_team_type,
        'createdAt', v_created_at
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- FUNCTION OWNERSHIP & PERMISSIONS
-- -----------------------------------------------------------------------------
ALTER FUNCTION public.submit_registration_internal(JSONB) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.submit_registration_internal(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_registration_internal(JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.submit_registration_internal(JSONB) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.submit_registration_internal(JSONB) TO service_role;

COMMIT;
