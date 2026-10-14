-- =============================================================================
-- Migration: 20261014000001_create_registration_rpc.sql
-- Description: Creates the hardened internal registration function
--              public.submit_registration_internal(JSONB).
--
-- SECURITY ARCHITECTURE & THREAT MITIGATION:
-- 1. SECURITY DEFINER:
--    - The function executes with the privileges of its owner (postgres).
--    - This allows inserting into public.registrations, public.participants,
--      and public.startup_ideas while keeping Row Level Security (RLS) enabled
--      with ZERO public insert/select policies on those tables.
--    - In Supabase, the postgres role owns these tables and bypasses RLS by default.
--    - Function owner must be a trusted administrative role (postgres).
--
-- 2. HARDENED SEARCH PATH (Search-Path Injection Defense):
--    - search_path is set strictly to 'pg_catalog'.
--    - Placing only pg_catalog in the search path prevents search-path hijacking,
--      ensuring that an untrusted session cannot create malicious functions,
--      operators, or types in a temporary schema (pg_temp) or public schema
--      to shadow trusted system routines.
--    - All application tables are explicitly schema-qualified as public.<table_name>.
--    - Built-in types, operators, and functions resolve securely from pg_catalog.
--
-- 3. ACCESS CONTROL & LEAST PRIVILEGE:
--    - EXECUTE privilege is explicitly REVOKED from PUBLIC, anon, and authenticated.
--    - EXECUTE privilege is granted ONLY to the service_role.
--    - The browser anon key cannot execute this routine via PostgREST RPC.
--    - Calling this routine is restricted to trusted server environments (e.g. Edge Functions).
--
-- 4. ATOMICITY & SEQUENCE BEHAVIOR:
--    - All validation occurs BEFORE any database INSERT.
--    - Registration, participant(s), and startup idea records are created
--      within a single transaction. Any validation or constraint failure
--      triggers an EXCEPTION, rolling back all table modifications.
--    - The registration_number identity column is generated automatically.
--      Like all PostgreSQL sequences, aborted transactions will consume their
--      allocated sequence numbers; numbers are guaranteed unique, but not
--      guaranteed to be gapless or strictly consecutive.
--
-- 5. SKETCH FILE PATH NOTICE:
--    - Storing sketchFilePath in the database records only the provided reference string.
--    - It DOES NOT verify that the file exists, was authorized, or was uploaded safely.
--    - Storage file validation (bucket existence, MIME type, file size, ownership)
--      must be performed independently at the API/Edge Function layer or via Storage RLS.
-- =============================================================================

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
    -- 3. PARTICIPANTS ARRAY VALIDATION
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
    -- Notice: This checks syntax/length only; storage file verification must occur externally.
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
        v_roll := trim(v_roll_raw);

        -- Enforce Academic-Year Roll Number Rules (aligns with frontend validation)
        IF v_academic_year = '1st Year' THEN
            -- 1st Year roll number is optional; if provided, must be exactly 13 digits
            IF length(v_roll) > 0 AND v_roll !~ '^[0-9]{13}$' THEN
                RAISE EXCEPTION 'Participant [%] (1st Year) roll number must be exactly 13 digits if provided', v_idx + 1;
            END IF;
        ELSIF v_academic_year = '2nd Year' THEN
            IF length(v_roll) = 0 THEN
                RAISE EXCEPTION 'Participant [%] (2nd Year) roll number is required', v_idx + 1;
            END IF;
            IF v_roll !~ '^25[0-9]{11}$' THEN
                RAISE EXCEPTION 'Participant [%] (2nd Year) roll number must be exactly 13 digits starting with 25', v_idx + 1;
            END IF;
        ELSIF v_academic_year = '3rd Year' THEN
            IF length(v_roll) = 0 THEN
                RAISE EXCEPTION 'Participant [%] (3rd Year) roll number is required', v_idx + 1;
            END IF;
            IF v_roll !~ '^24[0-9]{11}$' THEN
                RAISE EXCEPTION 'Participant [%] (3rd Year) roll number must be exactly 13 digits starting with 24', v_idx + 1;
            END IF;
        ELSIF v_academic_year = '4th Year' THEN
            IF length(v_roll) = 0 THEN
                RAISE EXCEPTION 'Participant [%] (4th Year) roll number is required', v_idx + 1;
            END IF;
            IF v_roll !~ '^23[0-9]{11}$' THEN
                RAISE EXCEPTION 'Participant [%] (4th Year) roll number must be exactly 13 digits starting with 23', v_idx + 1;
            END IF;
        END IF;

        -- Phone Number Validation (checks both syntax and actual numeric digit count)
        -- Note: In POSIX bracket expressions, spaces must be explicitly written; \s inside [] is not whitespace.
        IF jsonb_typeof(v_p->'phone') <> 'string' THEN
            RAISE EXCEPTION 'Participant [%] phone number is required and must be a string', v_idx + 1;
        END IF;
        v_phone := trim(v_p->>'phone');
        -- Allowed formatting characters: optional leading '+', digits, spaces, hyphens
        IF v_phone !~ '^[+]?[0-9 -]{10,25}$' THEN
            RAISE EXCEPTION 'Participant [%] phone number contains invalid characters', v_idx + 1;
        END IF;
        -- Validate actual number of numeric digits (must be 10 to 15 digits)
        v_phone_digits := regexp_replace(v_phone, '[^0-9]', '', 'g');
        IF length(v_phone_digits) < 10 OR length(v_phone_digits) > 15 THEN
            RAISE EXCEPTION 'Participant [%] phone number must contain between 10 and 15 digits (found % digits)', v_idx + 1, length(v_phone_digits);
        END IF;

        -- Email Address
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
    FOR v_idx IN 0 .. (v_participant_count - 1) LOOP
        v_p := v_participants->v_idx;
        v_academic_year := trim(v_p->>'academicYear');
        v_roll := trim(COALESCE(v_p->>'rollNumber', ''));

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
            NULLIF(v_roll, ''),
            trim(v_p->>'phone'),
            lower(trim(v_p->>'email'))
        );
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
-- FUNCTION OWNERSHIP
-- -----------------------------------------------------------------------------
-- Ensure the function is owned by the administrative database role (postgres).
-- A SECURITY DEFINER routine executes with the owner's privileges.
ALTER FUNCTION public.submit_registration_internal(JSONB) OWNER TO postgres;

-- -----------------------------------------------------------------------------
-- PRIVILEGES & SECURITY CONFIGURATION
-- -----------------------------------------------------------------------------
-- 1. Revoke default execution rights from all unprivileged roles
REVOKE ALL ON FUNCTION public.submit_registration_internal(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_registration_internal(JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.submit_registration_internal(JSONB) FROM authenticated;

-- 2. Grant execution rights strictly to the service_role (used by Edge Functions)
-- Note: service_role already possesses USAGE on the public schema in Supabase.
GRANT EXECUTE ON FUNCTION public.submit_registration_internal(JSONB) TO service_role;
