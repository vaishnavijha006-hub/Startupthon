// Setup: Supabase Edge Function: submit-registration
// Path: supabase/functions/submit-registration/index.ts
//
// Description:
// Secure API gateway for student registration submission.
// Validates HTTP request headers, body size, and payload structure, then
// executes the privileged database routine public.submit_registration_internal(JSONB)
// using the server-side SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// -----------------------------------------------------------------------------
// 1. CORS ALLOWLIST CONFIGURATION
// -----------------------------------------------------------------------------
// Explicit list of permitted origins. Arbitrary Origin reflection is rejected.
const DEFAULT_ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'https://codezy-startup-pitch-x0kr.bolt.host',
]);

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  if (DEFAULT_ALLOWED_ORIGINS.has(origin)) return true;

  // Support additional explicitly configured origins via environment variable
  const configured = Deno.env.get('ALLOWED_ORIGINS');
  if (configured) {
    const extraOrigins = configured.split(',').map((o) => o.trim()).filter(Boolean);
    if (extraOrigins.includes(origin)) return true;
  }
  return false;
}

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (origin && isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

// -----------------------------------------------------------------------------
// 2. BEST-EFFORT IN-MEMORY RATE LIMITING
// -----------------------------------------------------------------------------
// NOTE: This in-memory sliding window rate limiter is best-effort only.
// Because Supabase Edge Functions run across ephemeral, serverless worker
// instances, memory is not shared across instances and does not persist across
// recycles. It must NOT be considered robust or distributed production rate
// limiting (which requires Redis/Upstash or an API gateway WAF).
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

function getClientIp(req: Request): string {
  // Prioritize Cloudflare / platform connecting IP before forwarding chain
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  return 'unknown';
}

function checkRateLimit(ip: string): boolean {
  if (ip === 'unknown') return true; // Cannot reliably key without an IP
  const now = Date.now();

  // Prune expired records if map exceeds 1000 entries
  if (rateLimitMap.size > 1000) {
    for (const [key, record] of rateLimitMap.entries()) {
      if (record.resetAt <= now) {
        rateLimitMap.delete(key);
      }
    }
  }

  const record = rateLimitMap.get(ip);
  if (!record || record.resetAt <= now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  return true;
}

// -----------------------------------------------------------------------------
// 3. MAXIMUM BODY SIZE
// -----------------------------------------------------------------------------
const MAX_BODY_BYTES = 64 * 1024; // 64 KB

// -----------------------------------------------------------------------------
// 4. MAIN EDGE FUNCTION HANDLER
// -----------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');

  // Handle browser CORS security: reject disallowed origins
  if (origin && !isOriginAllowed(origin)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Cross-origin request forbidden. Origin not allowed.',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  const corsHeaders = buildCorsHeaders(origin);

  // A. Handle CORS preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // B. Enforce HTTP method (POST only)
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Method not allowed. Only POST requests are supported.',
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Allow': 'POST, OPTIONS',
        },
      }
    );
  }

  // C. Best-effort rate limiting check
  const clientIp = getClientIp(req);
  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Too many registration attempts. Please wait a moment before trying again.',
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      }
    );
  }

  // D. Enforce Content-Type header (application/json)
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid Content-Type. Request body must be application/json.',
      }),
      {
        status: 415,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // E. Enforce 64 KB maximum payload size (header check + streaming check)
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Payload too large. Maximum request body size is 64 KB.',
      }),
      {
        status: 413,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  if (!req.body) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Empty request body.',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Safely read body stream up to MAX_BODY_BYTES to prevent memory exhaustion
  let rawText = '';
  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Payload too large. Maximum request body size is 64 KB.',
          }),
          {
            status: 413,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
      rawText += decoder.decode(value, { stream: true });
    }
    rawText += decoder.decode();
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to read request body stream.',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // F. Parse JSON body
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawText);
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Malformed JSON payload. Please provide a valid JSON body.',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid payload: Root must be a non-null JSON object.',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // G. Structural schema checks before database call
  if (!body.teamType || (body.teamType !== 'solo' && body.teamType !== 'duo')) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid or missing teamType. Must be "solo" or "duo".',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  if (!Array.isArray(body.participants) || body.participants.length === 0) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid or missing participants. Must be a non-empty array.',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  if (body.teamType === 'solo' && body.participants.length !== 1) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Solo registration requires exactly 1 participant (received ${body.participants.length}).`,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  if (body.teamType === 'duo') {
    if (!Array.isArray(body.participants) || body.participants.length !== 2) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Duo registration requires exactly 2 participants.`,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const p0 = body.participants[0] as Record<string, unknown> | null;
    const p1 = body.participants[1] as Record<string, unknown> | null;
    const roll0 = typeof p0?.rollNumber === 'string' ? p0.rollNumber.trim() : '';
    const roll1 = typeof p1?.rollNumber === 'string' ? p1.rollNumber.trim() : '';
    if (roll0 !== '' && roll1 !== '' && roll0 === roll1) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Duo participants cannot share the same roll number (${roll0}).`,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const email0 = typeof p0?.email === 'string' ? p0.email.trim().toLowerCase() : '';
    const email1 = typeof p1?.email === 'string' ? p1.email.trim().toLowerCase() : '';
    if (email0 !== '' && email0 === email1) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Duo participants cannot share the same email address (${email0}).`,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }

  const ideaObj = body.idea as Record<string, unknown> | undefined;
  if (!ideaObj || typeof ideaObj !== 'object' || Array.isArray(ideaObj)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid or missing startup idea details.',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // H. Construct sanitized payload matching public.submit_registration_internal(JSONB)
  // Notice: sketchFilePath is set only when an actual non-empty path is provided.
  // We do not fall back to sketchFileName or claim an upload occurred.
  const validatedSketchPath =
    typeof ideaObj?.sketchFilePath === 'string' && ideaObj.sketchFilePath.trim().length > 0
      ? ideaObj.sketchFilePath.trim()
      : null;

  const participantsList = Array.isArray(body.participants)
    ? (body.participants as Array<Record<string, unknown>>)
    : [];

  const sanitizedPayload = {
    teamType: body.teamType,
    participants: participantsList.map((p: Record<string, unknown>) => ({
      fullName: typeof p?.fullName === 'string' ? p.fullName : '',
      academicYear: typeof p?.academicYear === 'string' ? p.academicYear : '',
      section: typeof p?.section === 'string' ? p.section : '',
      rollNumber: typeof p?.rollNumber === 'string' ? p.rollNumber : '',
      phone: typeof p?.phone === 'string' ? p.phone : '',
      email: typeof p?.email === 'string' ? p.email : '',
    })),
    idea: {
      title: typeof ideaObj?.title === 'string' ? ideaObj.title : '',
      description: typeof ideaObj?.description === 'string' ? ideaObj.description : '',
      domain: typeof ideaObj?.domain === 'string' ? ideaObj.domain : '',
      prototypeAvailable: typeof ideaObj?.prototypeAvailable === 'boolean' ? ideaObj.prototypeAvailable : null,
      sketchFilePath: validatedSketchPath,
    },
  };

  // I. Retrieve server-side credentials
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Server configuration error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined in Edge Function environment');
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server configuration error. Registration service unavailable.',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // J. Invoke the restricted internal RPC using the privileged service-role client
  try {
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await adminClient.rpc('submit_registration_internal', {
      p_payload: sanitizedPayload,
    });

    if (error) {
      // Log diagnostic details securely on server console
      console.error('RPC submission error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      // User validation exceptions raised by PL/pgSQL have code P0001
      if (error.code === 'P0001') {
        const clientMessage = error.message.replace(/^P0001:\s*/i, '').trim();
        return new Response(
          JSON.stringify({
            success: false,
            error: clientMessage || 'Registration validation failed.',
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Unexpected database error: return safe generic message to avoid exposing internal schema details
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Registration processing failed. Please verify your details and try again.',
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // K. Return successful response with generated registration details
    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : 'Unknown exception';
    console.error('Unexpected exception during registration submission:', errMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'An unexpected server error occurred while processing your registration. Please try again.',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
