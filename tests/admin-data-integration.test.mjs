import test from 'node:test';
import assert from 'node:assert/strict';
import { mapDatabaseToDashboardRegistrations } from '../src/services/adminRegistrationSource.ts';
import {
  flattenRegistrations,
  filterStudentRows,
  sortStudentRows,
  paginateItems,
  summarizeRegistrations,
} from '../src/utils/adminDashboard.ts';
import { registrationsToCsv } from '../src/utils/export.ts';

const mockRawDatabaseRows = [
  {
    id: 'b6f63459-0001-4000-8000-000000000001',
    registration_number: 1,
    team_type: 'solo',
    created_at: '2026-10-14T10:00:00.000Z',
    participants: [
      {
        id: 'p-1',
        full_name: 'Aarav Sharma',
        academic_year: '2nd Year',
        section: 'A',
        roll_number: '2503330100134',
        phone: '+91 98765 43210',
        email: 'aarav@example.com',
      },
    ],
    startup_ideas: [
      {
        id: 'i-1',
        title: 'Smart Solar Inverter',
        description: 'IoT solar tracking converter system.',
        domain: 'environment',
        prototype_available: true,
        sketch_file_path: 'sketches/solar.pdf',
      },
    ],
  },
  {
    id: 'b6f63459-0002-4000-8000-000000000002',
    registration_number: 2,
    team_type: 'duo',
    created_at: '2026-10-14T11:00:00.000Z',
    participants: [
      {
        id: 'p-2',
        full_name: 'Bhavna Patel',
        academic_year: '3rd Year',
        section: 'B',
        roll_number: '2403330100101',
        phone: '+91 98765 00001',
        email: 'bhavna@example.com',
      },
      {
        id: 'p-3',
        full_name: 'Chetan Kumar',
        academic_year: '1st Year',
        section: 'C',
        roll_number: '',
        phone: '+91 98765 00002',
        email: 'chetan@example.com',
      },
    ],
    startup_ideas: [
      {
        id: 'i-2',
        title: 'AI Health Companion',
        description: 'Personalized wellness diagnostics engine.',
        domain: 'healthcare',
        prototype_available: false,
        sketch_file_path: null,
      },
    ],
  },
];

test('data mapping converts raw database records into typed dashboard models', () => {
  const mapped = mapDatabaseToDashboardRegistrations(mockRawDatabaseRows);

  assert.equal(mapped.length, 2);

  // Solo record
  const solo = mapped[0];
  assert.equal(solo.id, 'REG-#1');
  assert.equal(solo.registrationNumber, 1);
  assert.equal(solo.teamType, 'solo');
  assert.equal(solo.participants.length, 1);
  assert.equal(solo.participants[0].fullName, 'Aarav Sharma');
  assert.equal(solo.participants[0].rollNumber, '2503330100134');
  assert.equal(solo.idea.title, 'Smart Solar Inverter');
  assert.equal(solo.idea.domain, 'environment');
  assert.equal(solo.idea.prototypeAvailable, true);

  // Duo record
  const duo = mapped[1];
  assert.equal(duo.id, 'REG-#2');
  assert.equal(duo.registrationNumber, 2);
  assert.equal(duo.teamType, 'duo');
  assert.equal(duo.participants.length, 2);
  assert.equal(duo.participants[0].fullName, 'Bhavna Patel');
  assert.equal(duo.participants[1].fullName, 'Chetan Kumar');
  assert.equal(duo.participants[1].rollNumber, '');
  assert.equal(duo.idea.title, 'AI Health Companion');
});

test('maps persisted shortlist status and keeps the database UUID separate from display ID', () => {
  const mapped = mapDatabaseToDashboardRegistrations([
    { ...mockRawDatabaseRows[0], id: 'db-registration-uuid', registration_number: 42, shortlist_status: 'shortlisted' },
    { ...mockRawDatabaseRows[1], id: 'db-registration-uuid-2', registration_number: 43, shortlist_status: 'rejected' },
    { ...mockRawDatabaseRows[0], id: 'db-registration-uuid-3', registration_number: 44 },
  ]);

  assert.equal(mapped[0].databaseId, 'db-registration-uuid');
  assert.equal(mapped[0].id, 'REG-#42');
  assert.equal(mapped[0].shortlistStatus, 'shortlisted');
  assert.equal(mapped[1].shortlistStatus, 'rejected');
  assert.equal(mapped[2].shortlistStatus, 'pending');
});

test('solo and duo registration grouping preserves accurate registration counts', () => {
  const mapped = mapDatabaseToDashboardRegistrations(mockRawDatabaseRows);
  const summary = summarizeRegistrations(mapped);

  // Total registrations must be 2 (1 solo + 1 duo), NOT 3
  assert.equal(summary.totalRegistrations, 2, 'Duo registration must not count as two registrations');
  assert.equal(summary.firstYearStudents, 1);
  assert.equal(summary.secondYearStudents, 1);
  assert.equal(summary.seniorStudents, 1); // 3rd Year is senior
});

test('search and filters match across individual student records', () => {
  const mapped = mapDatabaseToDashboardRegistrations(mockRawDatabaseRows);
  const rows = flattenRegistrations(mapped);

  // 3 individual participant rows from 2 registrations
  assert.equal(rows.length, 3);

  // Search by name
  assert.equal(filterStudentRows(rows, 'Aarav', 'all').length, 1);
  assert.equal(filterStudentRows(rows, 'Chetan', 'all').length, 1);

  // Search by roll number
  assert.equal(filterStudentRows(rows, '2503330100134', 'all').length, 1);

  // Search by email
  assert.equal(filterStudentRows(rows, 'bhavna@example.com', 'all').length, 1);

  // Filter by academic year
  assert.equal(filterStudentRows(rows, '', '1st Year').length, 1);
  assert.equal(filterStudentRows(rows, '', '2nd Year').length, 1);
  assert.equal(filterStudentRows(rows, '', '3rd Year').length, 1);
  assert.equal(filterStudentRows(rows, '', '4th Year').length, 0);
});

test('sorting orders students by name, roll number, and registration date', () => {
  const mapped = mapDatabaseToDashboardRegistrations(mockRawDatabaseRows);
  const rows = flattenRegistrations(mapped);

  // Sort by student name ascending
  const sortedByName = sortStudentRows(rows, 'name', 'asc');
  assert.deepEqual(
    sortedByName.map((r) => r.participant.fullName),
    ['Aarav Sharma', 'Bhavna Patel', 'Chetan Kumar']
  );

  // Sort by registration date descending
  const sortedByDate = sortStudentRows(rows, 'registeredAt', 'desc');
  assert.equal(sortedByDate[0].registration.id, 'REG-#2');
});

test('pagination correctly slices rows', () => {
  const mapped = mapDatabaseToDashboardRegistrations(mockRawDatabaseRows);
  const rows = flattenRegistrations(mapped);

  const page1 = paginateItems(rows, 1, 2);
  assert.equal(page1.length, 2);

  const page2 = paginateItems(rows, 2, 2);
  assert.equal(page2.length, 1);

  const pageEmpty = paginateItems(rows, 3, 2);
  assert.equal(pageEmpty.length, 0);
});

test('CSV export exports exactly the three required columns in order', () => {
  const mapped = mapDatabaseToDashboardRegistrations(mockRawDatabaseRows);
  const csv = registrationsToCsv(mapped);

  const lines = csv.trim().split(/\r\n|\n/);

  // 1. Header assertion: starts with UTF-8 BOM, followed by exactly three required headers
  assert.ok(csv.startsWith('\uFEFF'), 'CSV should start with UTF-8 BOM');
  assert.equal(lines[0], '"Student Section","Student Roll Number","Startup Idea Title"');

  // 2. Row count: 1 header row + 1 solo row + 2 duo rows = 4 rows total
  assert.equal(lines.length, 4);

  // 3. Exactly three fields per data row
  for (let i = 1; i < lines.length; i++) {
    // Each row is three quoted fields: "field1","field2","field3"
    const fields = lines[i].split('","');
    assert.equal(fields.length, 3, `Row ${i} should have exactly three fields`);
  }

  // 4. Solo registration: 1 row with section A, roll number, idea title
  assert.equal(lines[1], '"A","2503330100134","Smart Solar Inverter"');

  // 5. Duo registration: 2 rows with respective section/roll, both sharing idea title
  assert.equal(lines[2], '"B","2403330100101","AI Health Companion"');
  assert.equal(lines[3], '"C","","AI Health Companion"');
});

test('CSV export separates solo (one row) and duo (two rows) correctly', () => {
  const soloOnly = mapDatabaseToDashboardRegistrations([mockRawDatabaseRows[0]]);
  const soloCsv = registrationsToCsv(soloOnly).trim().split(/\r\n|\n/);
  assert.equal(soloCsv.length, 2, 'Solo export must contain 1 header and exactly 1 data row');

  const duoOnly = mapDatabaseToDashboardRegistrations([mockRawDatabaseRows[1]]);
  const duoCsv = registrationsToCsv(duoOnly).trim().split(/\r\n|\n/);
  assert.equal(duoCsv.length, 3, 'Duo export must contain 1 header and exactly 2 data rows');
});

test('CSV export safely handles commas, quotes, newlines, and formula injection', () => {
  const injectionData = [
    {
      id: 'reg-special',
      registration_number: 10,
      team_type: 'solo',
      created_at: '2026-10-14T10:00:00.000Z',
      participants: [
        {
          id: 'p-special',
          full_name: 'Ignored Name',
          academic_year: '2nd Year',
          section: 'Section "A", Suite 4', // Contains quotes and comma
          roll_number: '=cmd|"/C calc"!A0', // Formula prefix =
          phone: '9876543210',
          email: 'test@example.com',
        },
      ],
      startup_ideas: [
        {
          id: 'i-special',
          title: '+Idea With\nNewline and @Tag', // Formula prefix +, newline, and @
          description: 'Description',
          domain: 'fintech',
          prototype_available: false,
          sketch_file_path: null,
        },
      ],
    },
  ];

  const mapped = mapDatabaseToDashboardRegistrations(injectionData);
  const csv = registrationsToCsv(mapped);

  // Section with quotes and comma must be escaped with doubled quotes
  assert.match(csv, /"Section ""A"", Suite 4"/);

  // Roll number with formula prefix = must be neutralized with leading single quote
  assert.match(csv, /"'=cmd\|""\/C calc""!A0"/);

  // Idea title with formula prefix + must be neutralized with leading single quote and preserve newline
  assert.match(csv, /"'\+Idea With\nNewline and @Tag"/);

  // Unrelated fields must not be present
  assert.doesNotMatch(csv, /Ignored Name/);
  assert.doesNotMatch(csv, /Registration ID/);
  assert.doesNotMatch(csv, /fintech/);
});

test('handles empty dataset safely', () => {
  const empty = mapDatabaseToDashboardRegistrations([]);
  assert.deepEqual(empty, []);
  assert.equal(flattenRegistrations(empty).length, 0);
  assert.deepEqual(summarizeRegistrations(empty), {
    totalRegistrations: 0,
    firstYearStudents: 0,
    secondYearStudents: 0,
    seniorStudents: 0,
  });
});
