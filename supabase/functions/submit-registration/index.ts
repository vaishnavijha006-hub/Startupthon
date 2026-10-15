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
  'http://localhost:5174',
  'http://localhost:3000',
  'https://codezy-startup-pitch-x0kr.bolt.host',
  'https://startupthon.vercel.app',
  'https://startupthon-git-main-vaishnavijha006-3492s-projects.vercel.app',
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
const MAX_JSON_BYTES = 64 * 1024;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_BODY_BYTES = MAX_FILE_BYTES + MAX_JSON_BYTES + 32 * 1024;

// -----------------------------------------------------------------------------
// 4. MAIN EDGE FUNCTION HANDLER
// -----------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = buildCorsHeaders(origin);

  // A. Handle CORS preflight (OPTIONS) — must come first so browsers always
  // receive a well-formed preflight response regardless of whether the origin
  // is allowed. For disallowed origins, corsHeaders will omit
  // Access-Control-Allow-Origin and the browser will block the actual request.
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Handle browser CORS security: reject disallowed origins on non-preflight requests
  if (origin && !isOriginAllowed(origin)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Cross-origin request forbidden. Origin not allowed.',
      }),
      {
        status: 403,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
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

  // D. Accept JSON or a bounded multipart body containing JSON plus one sketch.
  const contentType = req.headers.get('content-type') || '';
  const isMultipart = contentType.toLowerCase().startsWith('multipart/form-data;');
  const isJson = contentType.toLowerCase().includes('application/json');
  if (!isJson && !isMultipart) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid Content-Type. Request body must be JSON or multipart form data.',
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

  // E. Bound the full request while streaming it into memory.
  const contentLength = req.headers.get('content-length');
  if (contentLength && Number(contentLength) > (isMultipart ? MAX_BODY_BYTES : MAX_JSON_BYTES)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: isMultipart ? 'Payload too large. Sketch files must be 5 MB or smaller.' : 'Payload too large. Maximum JSON payload size is 64 KB.',
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
  const chunks: Uint8Array[] = [];
  const reader = req.body.getReader();
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > (isMultipart ? MAX_BODY_BYTES : MAX_JSON_BYTES)) {
        await reader.cancel();
        return new Response(
          JSON.stringify({
            success: false,
            error: isMultipart ? 'Payload too large. Sketch files must be 5 MB or smaller.' : 'Payload too large. Maximum JSON payload size is 64 KB.',
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
      chunks.push(value);
    }
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

  const requestBytes = new Uint8Array(totalBytes);
  let requestOffset = 0;
  for (const chunk of chunks) {
    requestBytes.set(chunk, requestOffset);
    requestOffset += chunk.byteLength;
  }

  // F. Parse JSON body or multipart payload.
  let body: Record<string, unknown>;
  let sketchFile: File | null = null;
  let sketchExtension: string | null = null;
  try {
    if (isMultipart) {
      const parsedRequest = new Request(req.url, { method: 'POST', headers: req.headers, body: requestBytes });
      const form = await parsedRequest.formData();
      const payload = form.get('payload');
      const sketch = form.get('sketch');
      if (typeof payload !== 'string' || payload.length > MAX_JSON_BYTES) throw new Error('Invalid payload');
      if (sketch !== null && !(sketch instanceof File)) throw new Error('Invalid sketch');
      body = JSON.parse(payload);
      sketchFile = sketch instanceof File ? sketch : null;
    } else {
      body = JSON.parse(new TextDecoder().decode(requestBytes));
    }
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

  if (sketchFile) {
    const allowedTypes: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
      'application/pdf': 'pdf',
    };
    const extension = allowedTypes[sketchFile.type];
    if (!extension || sketchFile.size === 0 || sketchFile.size > MAX_FILE_BYTES) {
      return new Response(JSON.stringify({ success: false, error: 'Sketch must be a PNG, JPEG, WebP, or PDF file up to 5 MB.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const signature = new Uint8Array(await sketchFile.slice(0, 12).arrayBuffer());
    const isValidSignature = extension === 'png'
      ? signature.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => signature[index] === byte)
      : extension === 'jpg'
        ? signature.length >= 3 && signature[0] === 255 && signature[1] === 216 && signature[2] === 255
        : extension === 'webp'
          ? signature.length >= 12 && new TextDecoder().decode(signature.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(signature.slice(8, 12)) === 'WEBP'
          : new TextDecoder().decode(signature.slice(0, 5)) === '%PDF-';
    if (!isValidSignature) {
      return new Response(JSON.stringify({ success: false, error: 'The uploaded sketch file is not a valid file of the selected type.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    sketchExtension = extension;
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
  // Clients cannot choose a storage path; it is assigned only after a verified upload.
  const validatedSketchPath: string | null = null;

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
  let uploadedSketchPath: string | null = null;
  try {
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    if (sketchFile) {
      const objectPath = `${crypto.randomUUID()}.${sketchExtension}`;
      const { error: uploadError } = await adminClient.storage
        .from('registration-sketches')
        .upload(objectPath, sketchFile, { contentType: sketchFile.type, upsert: false });
      if (uploadError) {
        console.error('Sketch upload failed:', uploadError.name);
        return new Response(JSON.stringify({ success: false, error: 'Sketch upload failed. Please try again or submit without a sketch.' }), {
          status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      uploadedSketchPath = objectPath;
      sanitizedPayload.idea.sketchFilePath = objectPath;
    }

    const { data, error } = await adminClient.rpc('submit_registration_internal', {
      p_payload: sanitizedPayload,
    });

    if (error) {
      if (uploadedSketchPath) await adminClient.storage.from('registration-sketches').remove([uploadedSketchPath]);
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
    if (uploadedSketchPath) {
      const cleanupClient = createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
      await cleanupClient.storage.from('registration-sketches').remove([uploadedSketchPath]).catch(() => undefined);
    }
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
