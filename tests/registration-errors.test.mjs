import test from 'node:test';
import assert from 'node:assert/strict';
import { getRegistrationRequestErrorMessage } from '../src/utils/registrationErrors.ts';

test('classifies fetch and relay failures without exposing the underlying error', () => {
  assert.match(getRegistrationRequestErrorMessage({ kind: 'fetch' }), /Could not reach/);
  assert.match(getRegistrationRequestErrorMessage({ kind: 'relay' }), /could not route/);
  assert.match(getRegistrationRequestErrorMessage({ kind: 'unexpected' }), /unexpected/);
});

test('maps a duplicate roll-number response without echoing the submitted number', () => {
  const message = getRegistrationRequestErrorMessage({
    kind: 'http',
    status: 400,
    body: { error: 'Roll number "2503330100134" is already registered' },
  });

  assert.match(message, /already associated with a registration/);
  assert.doesNotMatch(message, /2503330100134/);
});

test('maps a duplicate email response without echoing the submitted address', () => {
  const message = getRegistrationRequestErrorMessage({
    kind: 'http',
    status: 400,
    body: { error: 'Duo participants cannot share the same email address (student@example.com)' },
  });

  assert.match(message, /email address is already associated/);
  assert.doesNotMatch(message, /student@example\.com/);
});

test('shows a safe academic-year validation message for known roll-number errors', () => {
  const message = getRegistrationRequestErrorMessage({
    kind: 'http',
    status: 400,
    body: { error: 'Participant [2] (3rd Year) roll number must be exactly 13 digits starting with 24' },
  });

  assert.match(message, /selected academic year requirements/);
});

test('does not display unknown HTTP body text or server internals', () => {
  const message = getRegistrationRequestErrorMessage({
    kind: 'http',
    status: 400,
    body: { error: 'SQL schema public.internal_table failed for student@example.com' },
  });

  assert.match(message, /rejected these details/);
  assert.doesNotMatch(message, /SQL|internal_table|student@example\.com/);
});

test('uses safe status-specific messages for HTTP and server errors', () => {
  assert.match(getRegistrationRequestErrorMessage({ kind: 'http', status: 403 }), /HTTP 403/);
  assert.match(getRegistrationRequestErrorMessage({ kind: 'http', status: 503 }), /HTTP 503/);
});
