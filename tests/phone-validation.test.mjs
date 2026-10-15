import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEmail, validatePhone, validateRegistration } from '../src/utils/validation.ts';

const participant = (overrides = {}) => ({
  fullName: 'Aarav Sharma',
  academicYear: '1st Year',
  section: 'A',
  rollNumber: '',
  phone: '9876543210',
  email: 'aarav@example.com',
  ...overrides,
});

const idea = (overrides = {}) => ({
  title: 'Solar idea',
  description: 'A useful clean energy product.',
  domain: 'environment',
  prototypeAvailable: false,
  sketchFileName: null,
  ...overrides,
});

test('phone validation matches the server digit-count rules', () => {
  assert.equal(validatePhone('+91 98765 43210'), true);
  assert.equal(validatePhone('1---------'), false);
  assert.equal(validatePhone('123456789'), false);
  assert.equal(validatePhone('1234567890123456'), false);
});

test('phone validation rejects characters the server does not accept', () => {
  assert.equal(validatePhone('(987) 654-3210'), false);
  assert.equal(validatePhone('１２３４５６７８９０'), false);
});

test('email validation matches the server format and maximum length', () => {
  assert.equal(validateEmail('student@example.com'), true);
  assert.equal(validateEmail('student@example.c'), false);
  assert.equal(validateEmail(`${'a'.repeat(244)}@example.com`), false);
});

test('registration validation enforces server-side maximum field lengths', () => {
  const errors = validateRegistration(
    'solo',
    [participant({ fullName: 'A'.repeat(101), section: 'A'.repeat(21) })],
    idea({ title: 'T'.repeat(201), description: 'D'.repeat(5001) }),
  );

  assert.match(errors.participants[0].fullName, /100 characters/);
  assert.match(errors.participants[0].section, /20 characters/);
  assert.match(errors.idea.title, /200 characters/);
  assert.match(errors.idea.description, /5000 characters/);
});
