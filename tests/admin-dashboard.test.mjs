import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  filterStudentRows,
  flattenRegistrations,
  paginateItems,
  sortStudentRows,
  summarizeRegistrations,
} from '../src/utils/adminDashboard.ts';
import { registrationsToCsv, studentRowsToCsv } from '../src/utils/export.ts';

const registration = (id, participant) => ({
  id,
  teamType: 'solo',
  participants: [participant],
  idea: { title: 'Idea', description: 'Description', domain: 'ai', prototypeAvailable: false, sketchFileName: null },
  createdAt: '2026-10-14T10:00:00.000Z',
});

const participant = (fullName, email, academicYear, rollNumber) => ({
  fullName, email, academicYear, rollNumber, section: 'A', phone: '9876543210',
});

test('dashboard rows search across student and idea identifiers and filter by academic year', () => {
  const rows = flattenRegistrations([
    registration('reg-1', participant('Asha Rao', 'asha@example.com', '1st Year', '')),
    registration('reg-2', participant('Bala Das', 'bala@example.com', '2nd Year', '2503330100134')),
  ]);

  assert.equal(filterStudentRows(rows, 'asha', 'all').length, 1);
  assert.equal(filterStudentRows(rows, 'BALA@EXAMPLE.COM', 'all').length, 1);
  assert.equal(filterStudentRows(rows, '2503330100134', 'all').length, 1);
  assert.equal(filterStudentRows(rows, 'reg-2', 'all').length, 1);
  assert.equal(filterStudentRows(rows, 'idea', 'all').length, 2);
  assert.equal(filterStudentRows(rows, '', '2nd Year').length, 1);
});

test('dashboard filters by domain and shortlist status and CSV exports only matching students', () => {
  const first = registration('REG-#1', participant('Asha Rao', 'asha@example.com', '1st Year', '1'));
  const second = registration('REG-#2', participant('Bala Das', 'bala@example.com', '2nd Year', '2'));
  first.shortlistStatus = 'shortlisted';
  second.shortlistStatus = 'pending';
  second.idea.domain = 'healthcare';
  const rows = flattenRegistrations([first, second]);
  const filtered = filterStudentRows(rows, '', 'all', 'healthcare', 'pending');
  assert.deepEqual(filtered.map(({ participant: item }) => item.fullName), ['Bala Das']);
  assert.equal(studentRowsToCsv(filtered).trim().split(/\r\n|\n/).length, 2);
});

test('dashboard sorting and summaries use registration and participant counts correctly', () => {
  const registrations = [
    registration('reg-2', participant('Bala Das', 'bala@example.com', '2nd Year', '2503330100134')),
    registration('reg-1', participant('Asha Rao', 'asha@example.com', '1st Year', '')),
  ];
  registrations[0].createdAt = '2026-10-14T10:00:00.000Z';
  registrations[1].createdAt = '2026-10-13T10:00:00.000Z';
  const rows = flattenRegistrations(registrations);

  assert.deepEqual(sortStudentRows(rows, 'name', 'asc').map(({ participant: item }) => item.fullName), ['Asha Rao', 'Bala Das']);
  assert.deepEqual(sortStudentRows(rows, 'academicYear', 'asc').map(({ participant: item }) => item.academicYear), ['1st Year', '2nd Year']);
  assert.deepEqual(sortStudentRows(rows, 'registeredAt', 'desc').map(({ registration: item }) => item.id), ['reg-2', 'reg-1']);
  assert.deepEqual(paginateItems(rows, 2, 1).map(({ participant: item }) => item.fullName), ['Asha Rao']);
  assert.deepEqual(summarizeRegistrations(registrations), {
    totalRegistrations: 2,
    firstYearStudents: 1,
    secondYearStudents: 1,
    seniorStudents: 0,
  });
});

test('CSV exports exactly three headers and escapes formula-like user input', () => {
  const record = registration('reg-1', {
    fullName: 'Test Student',
    email: 'test@example.com',
    academicYear: '2nd Year',
    rollNumber: '=2+3',
    section: '+SEC-A',
    phone: '9876543210',
  });
  record.idea.title = '@FormulaIdea';

  const csv = registrationsToCsv([record]);

  // Verify exactly three headers in the required order
  assert.match(csv, /^﻿"Student Section","Student Roll Number","Startup Idea Title"/);

  // Verify formula escaping
  assert.match(csv, /"'\+SEC-A"/);
  assert.match(csv, /"'=2\+3"/);
  assert.match(csv, /"'@FormulaIdea"/);

  // Verify excluded fields do NOT appear
  assert.doesNotMatch(csv, /College/);
  assert.doesNotMatch(csv, /Registration ID/);
  assert.doesNotMatch(csv, /Academic Year/);
});

test('dashboard exports the full available dataset and gates actions on successful loading', async () => {
  const dashboard = await readFile(new URL('../src/pages/AdminDashboard.tsx', import.meta.url), 'utf8');

  assert.match(dashboard, /setDataset\(await loadAdminRegistrations\(\)\)/, 'Dashboard data comes from the registration service');
  assert.match(dashboard, /const registrations = dataset\?\.status === 'available' \? dataset\.registrations : EMPTY_REGISTRATIONS/);
  assert.match(dashboard, /const allStudentRows = useMemo\(\(\) => flattenRegistrations\(registrations\)/);
  assert.match(dashboard, /exportStudentRowsCsv\(allStudentRows\)/);
  assert.match(dashboard, /exportShortlistedStudentRowsCsv\(allStudentRows\)/);
  assert.match(dashboard, /registration\.shortlistStatus === 'shortlisted'/);
  assert.match(dashboard, /disabled=\{!canExportData \|\| allStudentRows\.length === 0\}/);
  assert.match(dashboard, /disabled=\{!canExportData \|\| shortlistedRows\.length === 0\}/);
  assert.match(dashboard, /canExportData && allStudentRows\.length === 0/);
  assert.match(dashboard, /canExportData && allStudentRows\.length > 0 && shortlistedRows\.length === 0/);
  assert.match(dashboard, /const canExportData = !loading && !loadError && dataset\?\.status === 'available'/);
});
