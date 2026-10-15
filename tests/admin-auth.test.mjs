import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { isUserAdmin } from '../src/services/adminAuth.ts';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('isUserAdmin rejects null, undefined, or missing user objects', () => {
  assert.equal(isUserAdmin(null), false);
  assert.equal(isUserAdmin(undefined), false);
  assert.equal(isUserAdmin({}), false);
});

test('isUserAdmin rejects non-admin users and users without app_metadata', () => {
  const ordinaryUser = {
    id: 'user-123',
    email: 'student@example.com',
    app_metadata: { role: 'authenticated' },
  };
  assert.equal(isUserAdmin(ordinaryUser), false);

  const noAppMetadataUser = {
    id: 'user-456',
    email: 'student2@example.com',
  };
  assert.equal(isUserAdmin(noAppMetadataUser), false);
});

test('SECURITY: isUserAdmin NEVER trusts client-writable user_metadata', () => {
  // Attack vector: A student sets user_metadata: { role: 'admin', is_admin: true }
  // via supabase.auth.updateUser(). isUserAdmin must strictly ignore user_metadata.
  const maliciousUser = {
    id: 'user-attacker',
    email: 'attacker@example.com',
    app_metadata: { role: 'authenticated' }, // Server-controlled claim
    user_metadata: { role: 'admin', is_admin: true }, // Client-modifiable claim
  };
  assert.equal(isUserAdmin(maliciousUser), false, 'Must not grant admin from user_metadata');
});

test('isUserAdmin accepts authorized users with server-assigned app_metadata claims', () => {
  const adminByRole = {
    id: 'admin-1',
    email: 'lead.admin@codezy.edu',
    app_metadata: { role: 'admin' },
  };
  assert.equal(isUserAdmin(adminByRole), true);

  const adminByFlag = {
    id: 'admin-2',
    email: 'faculty.admin@codezy.edu',
    app_metadata: { is_admin: true },
  };
  assert.equal(isUserAdmin(adminByFlag), true);
});

test('simulates route guard states: unauthenticated, non-admin, and admin access', () => {
  function evaluateRouteGuard(authState) {
    if (authState.loading) {
      return { status: 'LOADING', render: 'SPINNER' };
    }
    if (!authState.user) {
      return { status: 'UNAUTHENTICATED', redirect: '/admin/login' };
    }
    if (!authState.isAdmin) {
      return { status: 'FORBIDDEN', render: 'ACCESS_DENIED_SCREEN', allowSignOut: true };
    }
    return { status: 'AUTHORIZED', render: 'DASHBOARD' };
  }

  // 1. Initial loading state (prevents redirect loop on page refresh)
  const loadingState = evaluateRouteGuard({ loading: true, user: null, isAdmin: false });
  assert.equal(loadingState.status, 'LOADING');
  assert.equal(loadingState.render, 'SPINNER');

  // 2. Unauthenticated user
  const unauthState = evaluateRouteGuard({ loading: false, user: null, isAdmin: false });
  assert.equal(unauthState.status, 'UNAUTHENTICATED');
  assert.equal(unauthState.redirect, '/admin/login');

  // 3. Authenticated non-admin (e.g. registered student)
  const nonAdminState = evaluateRouteGuard({
    loading: false,
    user: { id: 'u1', email: 'student@example.com' },
    isAdmin: false,
  });
  assert.equal(nonAdminState.status, 'FORBIDDEN');
  assert.equal(nonAdminState.render, 'ACCESS_DENIED_SCREEN');
  assert.equal(nonAdminState.allowSignOut, true);

  // 4. Authorized admin
  const adminState = evaluateRouteGuard({
    loading: false,
    user: { id: 'admin-1', email: 'admin@codezy.edu' },
    isAdmin: true,
  });
  assert.equal(adminState.status, 'AUTHORIZED');
  assert.equal(adminState.render, 'DASHBOARD');
});

test('simulates logout and expired session state transitions', () => {
  let sessionState = {
    user: { id: 'admin-1', email: 'admin@codezy.edu', app_metadata: { role: 'admin' } },
    tokenValid: true,
  };

  function getGuardState() {
    if (!sessionState.tokenValid || !sessionState.user) {
      return { redirect: '/admin/login' };
    }
    return { allowed: isUserAdmin(sessionState.user) };
  }

  // Active admin session
  assert.equal(getGuardState().allowed, true);

  // Simulate explicit logout
  sessionState = { user: null, tokenValid: false };
  assert.equal(getGuardState().redirect, '/admin/login');

  // Simulate session expiration / invalidated token
  sessionState = {
    user: { id: 'admin-1', email: 'admin@codezy.edu', app_metadata: { role: 'admin' } },
    tokenValid: false,
  };
  assert.equal(getGuardState().redirect, '/admin/login');
});

test('App.tsx protects /admin/dashboard with AdminRouteGuard', async () => {
  const appSource = await readSource('../src/App.tsx');
  assert.match(appSource, /import AdminRouteGuard from '@/);
  assert.match(appSource, /<Route element={<AdminRouteGuard \/>}>\s*<Route path="\/admin\/dashboard"/);
});

test('AdminLogin.tsx uses real loginAdmin and removes fake timeout', async () => {
  const loginSource = await readSource('../src/pages/AdminLogin.tsx');
  assert.match(loginSource, /import { loginAdmin, useAdminAuth } from '@/);
  assert.match(loginSource, /await loginAdmin\(email, password\)/);
  assert.doesNotMatch(loginSource, /setTimeout\([^)]*Admin authentication is not yet connected/);
});

test('AdminHeader.tsx provides sign out functionality', async () => {
  const headerSource = await readSource('../src/components/admin/AdminHeader.tsx');
  assert.match(headerSource, /import { logoutAdmin } from '@/);
  assert.match(headerSource, /logoutAdmin\(\)/);
  assert.match(headerSource, /Sign out of admin session/);
});

test('non-admin login attempts clear the authenticated session and avoid exposing provider errors', async () => {
  const authSource = await readSource('../src/services/adminAuth.ts');
  assert.match(authSource, /if \(!isAdmin\)\s*\{[\s\S]*?supabase\.auth\.signOut\(\{ scope: 'local' \}\)/);
  assert.match(authSource, /Unable to sign in\. Please try again or contact an administrator\./);
  assert.doesNotMatch(authSource, /error\.message \|\| 'Authentication failed/);
});
