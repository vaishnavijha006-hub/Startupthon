import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('homepage includes a prominent physical certificate announcement and icon', async () => {
  const source = await readSource('../src/pages/LandingPage.tsx');
  assert.match(source, /aria-label="Physical certificate benefit"/);
  assert.match(source, /Award/);
  assert.match(source, /Physical certificate for every successfully registered participant/i);
  assert.match(source, /flex-col[^\n]*sm:flex-row/);
});

test('registration page shows the certificate benefit before the form', async () => {
  const source = await readSource('../src/pages/RegistrationPage.tsx');
  const benefitPosition = source.indexOf('Every successfully registered participant will receive a physical copy of their certificate.');
  const formPosition = source.indexOf('<form onSubmit={handleSubmit}');

  assert.match(source, /🎓 Physical Certificate Benefit/);
  assert.match(source, /Complete your registration to secure your participation\./);
  assert.ok(benefitPosition >= 0 && benefitPosition < formPosition);
  assert.match(source, /items-start gap-4[^\n]*sm:p-6/);
});

test('confirmation page keeps certificate eligibility conditional and avoids fake registration success', async () => {
  const source = await readSource('../src/pages/RegistrationConfirmation.tsx');
  assert.match(source, /Submission Saved Locally/);
  assert.match(source, /This is not an official event registration/);
  assert.match(source, /Once your registration is officially completed, you will be eligible to receive a physical copy of your certificate/);
  assert.match(source, /certificate distribution process\./);
  assert.doesNotMatch(source, /Registration Successful!/);
});
