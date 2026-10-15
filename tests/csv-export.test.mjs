import test from 'node:test';
import assert from 'node:assert/strict';
import {
  registrationsToCsv,
  studentRowsToCsv,
  escapeCsvCell,
  exportStudentRowsCsv,
  exportShortlistedStudentRowsCsv,
} from '../src/utils/export.ts';
import { flattenRegistrations } from '../src/utils/adminDashboard.ts';
import { parseCsv } from './helpers/parse-csv.mjs';

const EXPECTED_HEADERS = ['Student Section', 'Student Roll Number', 'Startup Idea Title'];

async function captureCsvDownload(exportAction) {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;
  let blob;
  let link;

  URL.createObjectURL = (value) => { blob = value; return 'blob:test'; };
  URL.revokeObjectURL = () => {};
  globalThis.document = {
    createElement: () => (link = { href: '', download: '', click() {}, remove() {} }),
    body: { appendChild(element) { link = element; } },
  };
  globalThis.window = { setTimeout() {} };

  try {
    const result = exportAction();
    return { result, filename: link?.download, csv: blob ? await blob.text() : null };
  } finally {
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
}

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

test('actual dashboard export helpers export all students and only exact shortlisted status', async () => {
  const regs = [
    makeRegistration('pending', [makeParticipant('Pending', '0012345678901', 'P')], { shortlistStatus: 'pending' }),
    makeRegistration('shortlisted-duo', [
      makeParticipant('Selected One', '2403330100134', 'S1'),
      makeParticipant('Selected Two', '0012345678902', 'S2'),
    ], { shortlistStatus: 'shortlisted' }),
    makeRegistration('rejected', [makeParticipant('Rejected', '2503330100003', 'R')], { shortlistStatus: 'rejected' }),
    makeRegistration('unknown', [makeParticipant('Unknown', '2503330100004', 'U')], { shortlistStatus: 'Shortlisted' }),
  ];
  const rows = flattenRegistrations(regs);

  const all = await captureCsvDownload(() => exportStudentRowsCsv(rows));
  const allRecords = parseCsv(all.csv);
  assert.equal(all.filename, 'codezy-all-students.csv');
  assert.deepEqual(allRecords[0], EXPECTED_HEADERS);
  assert.ok(allRecords.slice(1).every((row) => row.length === 3), 'Every all-student record has exactly three fields');
  assert.equal(allRecords.length, 6, 'All four registrations, including both duo participants, are exported');
  assert.deepEqual(allRecords.slice(1).map((row) => row[0]), ['P', 'S1', 'S2', 'R', 'U']);
  assert.equal(allRecords[1][1], '="0012345678901"', 'Leading zeros remain in the roll-number text formula');
  assert.equal(allRecords[2][1], '="2403330100134"', 'All 13 digits remain in the roll-number text formula');

  const shortlisted = await captureCsvDownload(() => exportShortlistedStudentRowsCsv(rows));
  const shortlistRecords = parseCsv(shortlisted.csv);
  assert.equal(shortlisted.filename, 'codezy-shortlisted-students.csv');
  assert.equal(shortlisted.result, 2, 'Return count is participants exported');
  assert.deepEqual(shortlistRecords[0], EXPECTED_HEADERS);
  assert.ok(shortlistRecords.slice(1).every((row) => row.length === 3), 'Every shortlisted record has exactly three fields');
  assert.deepEqual(shortlistRecords.slice(1).map((row) => row[0]), ['S1', 'S2']);
  assert.deepEqual(shortlistRecords.slice(1).map((row) => row[1]), ['="2403330100134"', '="0012345678902"']);
  assert.equal(shortlistRecords.length, 3, 'Duo shortlisted registration creates one row per participant');
});

test('shortlisted export reports zero and does not download when no registration is shortlisted', () => {
  const rows = flattenRegistrations([
    makeRegistration('pending', [makeParticipant('Pending', '2503330100001')], { shortlistStatus: 'pending' }),
    makeRegistration('rejected', [makeParticipant('Rejected', '2503330100002')], { shortlistStatus: 'rejected' }),
  ]);
  assert.equal(exportShortlistedStudentRowsCsv(rows), 0);
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
