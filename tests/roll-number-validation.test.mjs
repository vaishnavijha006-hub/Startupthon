import test from 'node:test';
import assert from 'node:assert/strict';
import { validateParticipant, validateRegistration, validateRollNumber, hasErrors } from '../src/utils/validation.ts';

const VALID_ROLLS = {
  '1st Year': '2503330100134',
  '2nd Year': '2503330100134',
  '3rd Year': '2403330100134',
  '4th Year': '2303330100134',
};

const participant = (academicYear, rollNumber = VALID_ROLLS[academicYear]) => ({
  fullName: 'Test Student',
  academicYear,
  section: 'A',
  rollNumber,
  phone: '+91 98765 43210',
  email: 'student@example.com',
});

const validIdea = {
  title: 'Test Idea',
  description: 'A sufficiently long test description.',
  domain: 'ai',
  prototypeAvailable: false,
  sketchFileName: null,
};

test('accepts correct 13-digit roll formats for all four academic years', () => {
  for (const [year, roll] of Object.entries(VALID_ROLLS)) {
    assert.equal(validateRollNumber(year, roll), undefined, `${year} should accept ${roll}`);
  }
});

test('allows an empty first-year roll number and requires it in years 2-4', () => {
  assert.equal(validateRollNumber('1st Year', ''), undefined);
  for (const year of ['2nd Year', '3rd Year', '4th Year']) {
    assert.match(validateRollNumber(year, ''), /required/i);
  }
});

test('rejects wrong academic-year prefixes', () => {
  assert.match(validateRollNumber('2nd Year', '2403330100134'), /start with 25/);
  assert.match(validateRollNumber('3rd Year', '2503330100134'), /start with 24/);
  assert.match(validateRollNumber('4th Year', '2403330100134'), /start with 23/);
});

test('rejects roll numbers with incorrect digit counts or non-digits', () => {
  for (const value of ['250333010013', '25033301001344', '25033301001A4', '25033301001-4']) {
    assert.match(validateRollNumber('2nd Year', value), /exactly 13 digits/);
  }
});

test('revalidates when the academic year changes', () => {
  const current = participant('2nd Year', '2403330100134');
  assert.ok(validateParticipant(current).rollNumber);

  current.academicYear = '3rd Year';
  assert.equal(validateParticipant(current).rollNumber, undefined);

  current.academicYear = '4th Year';
  assert.match(validateParticipant(current).rollNumber, /start with 23/);
});

test('allows a valid first-year registration without a roll number', () => {
  const errors = validateRegistration('solo', [participant('1st Year', '')], validIdea);
  assert.equal(errors.participants[0].rollNumber, undefined);
  assert.equal(hasErrors(errors), false);
});
