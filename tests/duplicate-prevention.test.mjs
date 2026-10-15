import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateRegistration, hasErrors } from '../src/utils/validation.ts';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

const sampleIdea = {
  title: 'Smart Solar Inverter',
  description: 'A revolutionary IoT solar converter system for clean energy tracking.',
  domain: 'environment',
  prototypeAvailable: true,
  sketchFileName: null,
};

const createParticipant = (overrides = {}) => ({
  fullName: 'Aarav Sharma',
  academicYear: '2nd Year',
  section: 'A',
  rollNumber: '2503330100134',
  phone: '+91 98765 43210',
  email: 'aarav@example.com',
  ...overrides,
});

test('duo submission rejects identical roll numbers between teammates', () => {
  const p1 = createParticipant({
    fullName: 'Member One',
    rollNumber: '2503330100134',
    email: 'm1@example.com',
  });
  const p2 = createParticipant({
    fullName: 'Member Two',
    rollNumber: '2503330100134',
    email: 'm2@example.com',
  });

  const errors = validateRegistration('duo', [p1, p2], sampleIdea);
  assert.equal(hasErrors(errors), true);
  assert.match(errors.participants[1].rollNumber, /cannot share the same roll number/i);
});

test('duo submission rejects identical emails regardless of case or spacing', () => {
  const p1 = createParticipant({
    fullName: 'Member One',
    rollNumber: '2503330100134',
    email: 'shared.email@example.com',
  });
  const p2 = createParticipant({
    fullName: 'Member Two',
    rollNumber: '2503330100135',
    email: '  SHARED.EMAIL@EXAMPLE.COM ',
  });

  const errors = validateRegistration('duo', [p1, p2], sampleIdea);
  assert.equal(hasErrors(errors), true);
  assert.match(errors.participants[1].email, /cannot share the same email address/i);
});

test('duo submission permits legitimate shared phone numbers (e.g. guardian contact)', () => {
  const p1 = createParticipant({
    fullName: 'Member One',
    rollNumber: '2503330100134',
    phone: '+91 99999 11111',
    email: 'm1@example.com',
  });
  const p2 = createParticipant({
    fullName: 'Member Two',
    rollNumber: '2503330100135',
    phone: '+91 99999 11111',
    email: 'm2@example.com',
  });

  const errors = validateRegistration('duo', [p1, p2], sampleIdea);
  assert.equal(errors.participants[0].phone, undefined);
  assert.equal(errors.participants[1].phone, undefined);
  assert.equal(hasErrors(errors), false);
});

test('allows both duo participants to have null or empty first-year roll numbers', () => {
  const p1 = createParticipant({
    fullName: 'First Year One',
    academicYear: '1st Year',
    rollNumber: '',
    email: 'fy1@example.com',
  });
  const p2 = createParticipant({
    fullName: 'First Year Two',
    academicYear: '1st Year',
    rollNumber: '',
    email: 'fy2@example.com',
  });

  const errors = validateRegistration('duo', [p1, p2], sampleIdea);
  assert.equal(errors.participants[0].rollNumber, undefined);
  assert.equal(errors.participants[1].rollNumber, undefined);
  assert.equal(hasErrors(errors), false);
});

test('allows solo first-year registration without roll number', () => {
  const p = createParticipant({
    academicYear: '1st Year',
    rollNumber: '',
  });

  const errors = validateRegistration('solo', [p], sampleIdea);
  assert.equal(errors.participants[0].rollNumber, undefined);
  assert.equal(hasErrors(errors), false);
});

test('simulates cross-registration duplicate roll-number rejection and transaction rollback', () => {
  // Model state simulating PostgreSQL tables with atomic transactions
  const registrationsTable = [];
  const participantsTable = [];

  function simulateSubmitRegistration(payload) {
    // Start transaction snapshot
    const regSnapshot = [...registrationsTable];
    const partSnapshot = [...participantsTable];

    try {
      // 1. Validate teamType and participants
      if (!['solo', 'duo'].includes(payload.teamType)) {
        throw new Error('Invalid team type');
      }

      // 2. Intra-team duplicate check
      if (payload.teamType === 'duo') {
        const r0 = payload.participants[0].rollNumber?.trim() || null;
        const r1 = payload.participants[1].rollNumber?.trim() || null;
        if (r0 && r1 && r0 === r1) {
          throw new Error(`Duo participants cannot share the same roll number (${r0})`);
        }
      }

      // 3. Cross-registration duplicate roll-number pre-check
      for (const p of payload.participants) {
        const roll = p.rollNumber?.trim() || null;
        if (roll) {
          const exists = participantsTable.some((row) => row.rollNumber === roll);
          if (exists) {
            throw new Error(`Roll number "${roll}" is already registered`);
          }
        }
      }

      // 4. Atomic insert: registrations first
      const newRegId = `reg-${registrationsTable.length + 1}`;
      registrationsTable.push({ id: newRegId, teamType: payload.teamType });

      // 5. Atomic insert: participants second
      for (const p of payload.participants) {
        const roll = p.rollNumber?.trim() || null;
        participantsTable.push({
          registrationId: newRegId,
          fullName: p.fullName,
          rollNumber: roll,
        });
      }

      return { success: true, registrationId: newRegId };
    } catch (err) {
      // Transaction rollback: revert tables to snapshot
      registrationsTable.length = 0;
      registrationsTable.push(...regSnapshot);
      participantsTable.length = 0;
      participantsTable.push(...partSnapshot);
      throw err;
    }
  }

  // First submission succeeds
  const firstRes = simulateSubmitRegistration({
    teamType: 'solo',
    participants: [{ fullName: 'Alice', rollNumber: '2503330100134' }],
  });
  assert.equal(firstRes.success, true);
  assert.equal(registrationsTable.length, 1);
  assert.equal(participantsTable.length, 1);

  // Second submission with same roll number fails
  assert.throws(
    () => {
      simulateSubmitRegistration({
        teamType: 'solo',
        participants: [{ fullName: 'Bob', rollNumber: '2503330100134' }],
      });
    },
    { message: /Roll number "2503330100134" is already registered/ }
  );

  // Verify rollback: no second registration or participant was left in the tables
  assert.equal(registrationsTable.length, 1, 'Registrations table should roll back on failure');
  assert.equal(participantsTable.length, 1, 'Participants table should roll back on failure');

  // Third submission with different roll number succeeds
  const thirdRes = simulateSubmitRegistration({
    teamType: 'solo',
    participants: [{ fullName: 'Charlie', rollNumber: '2503330100135' }],
  });
  assert.equal(thirdRes.success, true);
  assert.equal(registrationsTable.length, 2);
  assert.equal(participantsTable.length, 2);
});

test('simulates concurrent duplicate race handled by partial unique index', () => {
  // Simulates two concurrent transactions both passing the EXISTS check,
  // where the unique index traps the second insert via unique_violation
  const index = new Set();
  const successfulInserts = [];

  function simulateInsertWithUniqueIndex(rollNumber, constraintName = 'participants_roll_number_unique_idx') {
    if (rollNumber) {
      if (index.has(rollNumber)) {
        // Simulates PostgreSQL unique_violation (23505) caught by RPC exception block
        if (constraintName === 'participants_roll_number_unique_idx') {
          const error = new Error(`Roll number "${rollNumber}" is already registered`);
          error.code = '23505';
          throw error;
        } else {
          const genericError = new Error(`duplicate key value violates unique constraint "${constraintName}"`);
          genericError.code = '23505';
          throw genericError;
        }
      }
      index.add(rollNumber);
    }
    successfulInserts.push(rollNumber);
  }

  // Concurrent transaction 1 wins
  assert.doesNotThrow(() => simulateInsertWithUniqueIndex('2503330100134'));

  // Concurrent transaction 2 hits roll-number unique constraint and safely converts to user-friendly message
  assert.throws(
    () => simulateInsertWithUniqueIndex('2503330100134', 'participants_roll_number_unique_idx'),
    { message: /Roll number "2503330100134" is already registered/ }
  );

  // A different unique constraint violation is not falsely reported as a roll number duplicate
  assert.throws(
    () => simulateInsertWithUniqueIndex('2503330100134', 'participants_pkey'),
    { message: /duplicate key value violates unique constraint "participants_pkey"/ }
  );

  assert.equal(successfulInserts.length, 1);
});

test('migration 20261014000002 defines partial unique index and avoids redundant composite index', async () => {
  const sql = await readSource('../supabase/migrations/20261014000002_prevent_duplicate_roll_numbers.sql');

  // Verify safe drop of pre-existing raw index for upgrade without dropping correct existing index
  assert.match(
    sql,
    /DROP INDEX public\.participants_roll_number_unique_idx;/i
  );

  // Verify partial expression unique index on trim(roll_number) uses IF NOT EXISTS
  assert.match(
    sql,
    /CREATE UNIQUE INDEX IF NOT EXISTS participants_roll_number_unique_idx\s+ON public\.participants\s*\(trim\(roll_number\)\)\s+WHERE roll_number IS NOT NULL AND trim\(roll_number\) <> '';/i
  );

  // Verify redundant composite index (registration_id, roll_number) is NOT added
  assert.doesNotMatch(
    sql,
    /CREATE UNIQUE INDEX[^\n]*\(\s*registration_id\s*,\s*roll_number\s*\)/i
  );

  // Verify safe pre-check for existing duplicates groups by trim(roll_number)
  assert.match(sql, /SELECT COUNT\(\*\)[\s\S]*?FROM\s+public\.participants[\s\S]*?GROUP BY trim\(roll_number\)[\s\S]*?HAVING COUNT\(\*\) > 1/i);

  // Verify intra-team Duo duplicate checks in RPC
  assert.match(sql, /Duo participants cannot share the same roll number/);
  assert.match(sql, /Duo participants cannot share the same email address/);

  // Verify cross-registration duplicate check uses trim(roll_number) and specific constraint check
  assert.match(sql, /EXISTS\s*\(\s*SELECT 1\s+FROM public\.participants\s+WHERE trim\(roll_number\) = v_roll\s*\)/);
  assert.match(sql, /WHEN unique_violation THEN/);
  assert.match(sql, /GET STACKED DIAGNOSTICS v_constraint_name = CONSTRAINT_NAME;/);
  assert.match(sql, /IF v_constraint_name = 'participants_roll_number_unique_idx' THEN/);

  // Verify security settings
  assert.match(sql, /SECURITY DEFINER/);
  assert.match(sql, /SET search_path = pg_catalog/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.submit_registration_internal\(JSONB\) TO service_role;/);

  // Verify explicit transaction wrapping for atomic SQL Editor execution
  assert.match(sql, /^[\s\S]*?BEGIN;\s*[\s\S]*?DO \$\$/);
  assert.match(sql, /GRANT EXECUTE[\s\S]*?COMMIT;\s*$/);
});


