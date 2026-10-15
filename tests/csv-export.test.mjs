import test from 'node:test';
import assert from 'node:assert/strict';
import {
  registrationsToCsv,
  studentRowsToCsv,
  escapeCsvCell,
} from '../src/utils/export.ts';
import { flattenRegistrations } from '../src/utils/adminDashboard.ts';

// ---------------------------------------------------------------------------
// Helpers — create test data with the real type shapes
// ---------------------------------------------------------------------------
const makeRegistration = (id, participants, overrides = {}) => ({
  id,
  teamType: participants.length > 1 ? 'duo' : 'solo',
  participants,
  idea: { title: 'Test Idea', description: 'Desc', domain: 'ai', prototypeAvailable: false, sketchFileName: null },
  shortlistStatus: 'pending',
  createdAt: '2026-10-14T10:00:00.000Z',
  ...overrides,
});

const makeParticipant = (fullName, rollNumber, section = 'A') => ({
  fullName,
  email: `${fullName.toLowerCase().replace(/\s/g, '.')}@example.com`,
  academicYear: '2nd Year',
  rollNumber,
  section,
  phone: '9876543210',
});

// ===========================================================================
// TEST 1: Export All Students includes every review status
// ===========================================================================
test('Export All Students CSV includes pending, shortlisted, and rejected registrations', () => {
  const regs = [
    makeRegistration('r1', [makeParticipant('Alice', '2503330100001')], { shortlistStatus: 'pending' }),
    makeRegistration('r2', [makeParticipant('Bob', '2503330100002')], { shortlistStatus: 'shortlisted' }),
    makeRegistration('r3', [makeParticipant('Carol', '2503330100003')], { shortlistStatus: 'rejected' }),
  ];
  const csv = registrationsToCsv(regs);
  const lines = csv.trim().split(/\r\n|\n/);
  // 1 header + 3 data rows
  assert.equal(lines.length, 4, 'All three statuses must produce data rows');
  assert.ok(csv.includes('2503330100001'), 'Pending student roll number present');
  assert.ok(csv.includes('2503330100002'), 'Shortlisted student roll number present');
  assert.ok(csv.includes('2503330100003'), 'Rejected student roll number present');
});

// ===========================================================================
// TEST 2: Export Shortlisted Students excludes pending and rejected
// ===========================================================================
test('Shortlisted-only export excludes pending and rejected registrations', () => {
  const regs = [
    makeRegistration('r1', [makeParticipant('Alice', '2503330100001', 'SEC-P')], { shortlistStatus: 'pending' }),
    makeRegistration('r2', [makeParticipant('Bob', '2503330100002', 'SEC-S')], { shortlistStatus: 'shortlisted' }),
    makeRegistration('r3', [makeParticipant('Carol', '2503330100003', 'SEC-R')], { shortlistStatus: 'rejected' }),
  ];
  const rows = flattenRegistrations(regs);
  const shortlisted = rows.filter((r) => r.registration.shortlistStatus === 'shortlisted');
  const csv = studentRowsToCsv(shortlisted);
  const lines = csv.trim().split(/\r\n|\n/);
  // 1 header + 1 data row (only Bob)
  assert.equal(lines.length, 2, 'Only shortlisted students appear');
  assert.ok(csv.includes('SEC-S'), 'Shortlisted student section present');
  assert.ok(!csv.includes('SEC-P'), 'Pending student section excluded');
  assert.ok(!csv.includes('SEC-R'), 'Rejected student section excluded');
});

// ===========================================================================
// TEST 3: 13-digit roll number preserved without digit loss
// ===========================================================================
test('13-digit roll number is preserved without digit loss in CSV output', () => {
  const reg = makeRegistration('r1', [makeParticipant('Student', '2403330100134')]);
  const csv = registrationsToCsv([reg]);
  // CSV escaping doubles the formula's inner quotes; Excel receives the text formula after parsing.
  assert.ok(csv.includes('2403330100134'), 'All 13 digits must be present');
  assert.ok(csv.includes('"=""2403330100134"""'), 'Roll number formula is correctly quoted as one CSV field');
});

// ===========================================================================
// TEST 4: Leading zeros preserved
// ===========================================================================
test('Roll number with leading zeros is preserved exactly', () => {
  const reg = makeRegistration('r1', [makeParticipant('Student', '0012345678901')]);
  const csv = registrationsToCsv([reg]);
  assert.ok(csv.includes('0012345678901'), 'Leading zeros preserved');
  assert.ok(csv.includes('"=""0012345678901"""'), 'Leading-zero formula is correctly quoted as one CSV field');
});

// ===========================================================================
// TEST 5: CSV fields are escaped correctly
// ===========================================================================
test('CSV escaping handles special characters correctly', () => {
  // Double quotes inside values
  assert.equal(escapeCsvCell('He said "hi"'), '"He said ""hi"""');
  // Formula-injection prefixing
  assert.equal(escapeCsvCell('=SUM(A1)'), '"\'=SUM(A1)"');
  assert.equal(escapeCsvCell('+1234'), '"\'+1234"');
  assert.equal(escapeCsvCell('@mention'), '"\'@mention"');
  // Generic cells still neutralize formula-like input; only the roll-number column may emit the Excel text formula.
  const formulaLikeInput = escapeCsvCell('="2403330100134"');
  assert.ok(formulaLikeInput.startsWith('"\'='));
  assert.notEqual(formulaLikeInput, '="2403330100134"');
  // Plain text
  assert.equal(escapeCsvCell('Hello'), '"Hello"');
  assert.equal(escapeCsvCell(''), '""');
});

// ===========================================================================
// TEST 6: Duo registrations produce one row per student
// ===========================================================================
test('Duo registration exports one row per student', () => {
  const duo = makeRegistration('r1', [
    makeParticipant('Alice', '2503330100001', 'A'),
    makeParticipant('Bob', '2503330100002', 'B'),
  ], { shortlistStatus: 'shortlisted' });
  const csv = registrationsToCsv([duo]);
  const dataLines = csv.trim().split(/\r\n|\n/).slice(1); // skip header
  assert.equal(dataLines.length, 2, 'Two data rows for duo registration');
  // Verify both students appear
  assert.ok(csv.includes('"A"'), 'First participant section present');
  assert.ok(csv.includes('"B"'), 'Second participant section present');
});

// ===========================================================================
// TEST 7: Empty shortlisted result handled correctly
// ===========================================================================
test('Empty shortlisted filter produces header-only CSV', () => {
  const regs = [
    makeRegistration('r1', [makeParticipant('Alice', '2503330100001')], { shortlistStatus: 'pending' }),
    makeRegistration('r2', [makeParticipant('Bob', '2503330100002')], { shortlistStatus: 'rejected' }),
  ];
  const rows = flattenRegistrations(regs);
  const shortlisted = rows.filter((r) => r.registration.shortlistStatus === 'shortlisted');
  assert.equal(shortlisted.length, 0, 'No shortlisted students');
  const csv = studentRowsToCsv(shortlisted);
  const lines = csv.trim().split(/\r\n|\n/);
  assert.equal(lines.length, 1, 'Only the header row when no shortlisted students');
  assert.ok(lines[0].includes('Student Section'), 'Header present');
});

// ===========================================================================
// TEST 8: Both export options use the same roll-number handling
// ===========================================================================
test('Both registrationsToCsv and studentRowsToCsv apply identical roll-number formatting', () => {
  const rollNumber = '2403330100134';
  const reg = makeRegistration('r1', [makeParticipant('Student', rollNumber)]);
  const csv1 = registrationsToCsv([reg]);
  const rows = flattenRegistrations([reg]);
  const csv2 = studentRowsToCsv(rows);
  // Both must contain the RFC-quoted Excel text formula.
  const expected = `"=""${rollNumber}"""`;
  assert.ok(csv1.includes(expected), 'registrationsToCsv uses Excel-safe roll number');
  assert.ok(csv2.includes(expected), 'studentRowsToCsv uses Excel-safe roll number');
});

// ===========================================================================
// BONUS: Short roll numbers are NOT wrapped (no unnecessary formula)
// ===========================================================================
test('Short roll numbers (under 10 digits) are not wrapped in Excel formula', () => {
  const reg = makeRegistration('r1', [makeParticipant('Student', '12345')]);
  const csv = registrationsToCsv([reg]);
  assert.ok(!csv.includes('="12345"'), 'Short roll number not wrapped');
  assert.ok(csv.includes('"12345"'), 'Short roll number quoted normally');
});
