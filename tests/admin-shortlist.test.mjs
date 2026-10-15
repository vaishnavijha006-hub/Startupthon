import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('shortlist migration constrains values and permits only admin shortlist updates', async () => {
  const migration = await readSource('../supabase/migrations/20261015000004_admin_shortlist_status.sql');
  assert.match(migration, /shortlist_status TEXT NOT NULL DEFAULT 'pending'/);
  assert.match(migration, /CHECK \(shortlist_status IN \('pending', 'shortlisted', 'rejected'\)\)/);
  assert.match(migration, /FOR UPDATE\s+TO authenticated/);
  assert.match(migration, /auth\.jwt\(\) -> 'app_metadata'/);
  assert.match(migration, /REVOKE UPDATE ON public\.registrations FROM PUBLIC, anon, authenticated/);
  assert.match(migration, /GRANT UPDATE \(shortlist_status\) ON public\.registrations TO authenticated/);
});

test('admin dashboard source loads and updates only the shortlist field with safe errors', async () => {
  const source = await readSource('../src/services/adminRegistrationSource.ts');
  assert.match(source, /shortlist_status,/);
  assert.match(source, /\.update\(\{ shortlist_status: shortlistStatus \}\)/);
  assert.match(source, /\.eq\('id', databaseId\)/);
  assert.doesNotMatch(source, /error\.message/);
});

test('dashboard exposes shortlist editing and refreshes after a successful update', async () => {
  const dashboard = await readSource('../src/pages/AdminDashboard.tsx');
  assert.match(dashboard, /onShortlistChange=\{changeShortlistStatus\}/);
  assert.match(dashboard, /await refresh\(\);[\s\S]*shortlistStatus: status/);
  assert.match(dashboard, /id="shortlist-status"/);
});
