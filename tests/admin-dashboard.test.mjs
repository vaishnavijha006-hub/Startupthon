import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterStudentRows,
  flattenRegistrations,
  paginateItems,
  sortStudentRows,
  summarizeRegistrations,
} from '../src/utils/adminDashboard.ts';
import { registrationsToCsv } from '../src/utils/export.ts';

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

test('dashboard rows search by name, email, and roll number and filter by academic year', () => {
  const rows = flattenRegistrations([
    registration('reg-1', participant('Asha Rao', 'asha@example.com', '1st Year', '')),
    registration('reg-2', participant('Bala Das', 'bala@example.com', '2nd Year', '2503330100134')),
  ]);

  assert.equal(filterStudentRows(rows, 'asha', 'all').length, 1);
  assert.equal(filterStudentRows(rows, 'BALA@EXAMPLE.COM', 'all').length, 1);
  assert.equal(filterStudentRows(rows, '2503330100134', 'all').length, 1);
  assert.equal(filterStudentRows(rows, '', '2nd Year').length, 1);
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

test('CSV escapes formula-like user input and labels college as not collected', () => {
  const record = registration('reg-1', participant('=2+3', '+student@example.com', '1st Year', ''));
  const csv = registrationsToCsv([record]);

  assert.match(csv, /College \(not collected; proposed field\)/);
  assert.match(csv, /"Not collected"/);
  assert.match(csv, /"'=2\+3"/);
  assert.match(csv, /"'\+student@example\.com"/);
});
