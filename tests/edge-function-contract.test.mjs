import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('submit-registration Edge Function enforces strict CORS allowlist and handles preflight', async () => {
  const code = await readSource('../supabase/functions/submit-registration/index.ts');

  // Verify default allowed origins contain the local dev ports and production bolt host
  assert.match(code, /'http:\/\/localhost:5173'/);
  assert.match(code, /'http:\/\/127\.0\.0\.1:5173'/);
  assert.match(code, /'http:\/\/localhost:5174'/);
  assert.match(code, /'http:\/\/localhost:3000'/);
  assert.match(code, /'https:\/\/codezy-startup-pitch-x0kr\.bolt\.host'/);

  // Verify support for dynamically configured production origins via ALLOWED_ORIGINS secret
  assert.match(code, /Deno\.env\.get\('ALLOWED_ORIGINS'\)/);

  // Verify OPTIONS preflight returns HTTP 204
  assert.match(code, /req\.method === 'OPTIONS'/);
  assert.match(code, /status:\s*204/);

  // Verify non-allowed origins receive 403 Forbidden
  assert.match(code, /Cross-origin request forbidden/);
  assert.match(code, /status:\s*403/);
});

// ─── NEW: CORS-specific tests ────────────────────────────────────────────────

test('submit-registration includes live Vercel production origin in DEFAULT_ALLOWED_ORIGINS', async () => {
  const code = await readSource('../supabase/functions/submit-registration/index.ts');

  // The live frontend deployed on Vercel must be explicitly listed
  assert.match(
    code,
    /'https:\/\/startupthon\.vercel\.app'/,
    "DEFAULT_ALLOWED_ORIGINS must contain 'https://startupthon.vercel.app'"
  );
});

test('submit-registration OPTIONS preflight handler appears before the disallowed-origin guard', async () => {
  const code = await readSource('../supabase/functions/submit-registration/index.ts');

  // Browsers send OPTIONS before the real request.  The preflight branch MUST execute
  // before the 403 origin guard so the browser always gets a well-formed preflight reply.
  const optionsIdx = code.indexOf("req.method === 'OPTIONS'");
  const guardIdx   = code.indexOf('Cross-origin request forbidden');

  assert.ok(optionsIdx !== -1, "OPTIONS preflight handler must exist in source");
  assert.ok(guardIdx   !== -1, "Disallowed-origin guard must exist in source");
  assert.ok(
    optionsIdx < guardIdx,
    `OPTIONS handler (char ${optionsIdx}) must appear before the 403 origin guard (char ${guardIdx})`
  );
});

test('submit-registration 403 disallowed-origin response spreads corsHeaders', async () => {
  const code = await readSource('../supabase/functions/submit-registration/index.ts');

  // Locate the 403 block and verify it spreads corsHeaders so the browser can
  // read the error body (and so Access-Control-Allow-Origin is set for allowed origins).
  const block403Start = code.indexOf('Cross-origin request forbidden');
  assert.ok(block403Start !== -1, '403 block must exist');

  // Walk backwards ~400 chars to capture the full response literal that wraps the error
  const context = code.slice(Math.max(0, block403Start - 400), block403Start + 200);
  assert.match(
    context,
    /\.\.\.corsHeaders/,
    '403 response object must spread ...corsHeaders'
  );
});

// ─── END new CORS tests ──────────────────────────────────────────────────────

test('submit-registration Edge Function enforces payload size limits and in-memory rate limiting', async () => {
  const code = await readSource('../supabase/functions/submit-registration/index.ts');

  // Verify 64 KB payload boundary
  assert.match(code, /MAX_BODY_BYTES\s*=\s*64\s*\*\s*1024/);
  assert.match(code, /Payload too large/);
  assert.match(code, /status:\s*413/);

  // Verify rate limiting configuration
  assert.match(code, /RATE_LIMIT_WINDOW_MS\s*=\s*60\s*\*\s*1000/);
  assert.match(code, /MAX_REQUESTS_PER_WINDOW\s*=\s*5/);
  assert.match(code, /status:\s*429/);
});

test('submit-registration Edge Function secures service role credentials and prevents leak in responses', async () => {
  const code = await readSource('../supabase/functions/submit-registration/index.ts');

  // Service role key is read from server environment only
  assert.match(code, /Deno\.env\.get\('SUPABASE_SERVICE_ROLE_KEY'\)/);
  assert.match(code, /Deno\.env\.get\('SUPABASE_URL'\)/);

  // Calls submit_registration_internal with sanitized payload
  assert.match(code, /adminClient\.rpc\('submit_registration_internal',\s*\{\s*p_payload:\s*sanitizedPayload/);

  // User-facing validation exceptions (code P0001) mapped to 400
  assert.match(code, /error\.code === 'P0001'/);
  assert.match(code, /status:\s*400/);

  // Unexpected exceptions return generic 500 without leaking stack traces or internal schema details
  assert.match(code, /Registration processing failed\. Please verify your details and try again\./);
  assert.match(code, /status:\s*500/);
});
