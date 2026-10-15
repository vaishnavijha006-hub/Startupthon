export type RegistrationRequestError =
  | { kind: 'http'; status: number; body?: unknown }
  | { kind: 'fetch' | 'relay' | 'unexpected' };

function getServerErrorText(body: unknown): string | undefined {
  if (typeof body === 'string') return body;
  if (!body || typeof body !== 'object' || !('error' in body)) return undefined;

  const message = (body as { error?: unknown }).error;
  return typeof message === 'string' ? message : undefined;
}

function getSafeValidationMessage(body: unknown): string | undefined {
  const message = getServerErrorText(body);
  if (!message) return undefined;

  if (/roll number.{0,80}(already registered|cannot share)|cannot share.{0,80}roll number/i.test(message)) {
    return 'This roll number is already associated with a registration. Check it or contact the organizers.';
  }
  if (/email address.{0,80}(already registered|cannot share)|cannot share.{0,80}email address/i.test(message)) {
    return 'This email address is already associated with a registration. Check it or contact the organizers.';
  }
  if (/roll number.{0,100}(required|exactly 13 digits|starting with)|academic year.{0,100}roll number/i.test(message)) {
    return 'A participant roll number does not match the selected academic year requirements.';
  }
  if (/email address.{0,80}(required|invalid|exceeds maximum)/i.test(message)) {
    return 'A participant email address is missing or invalid. Review the email fields and try again.';
  }
  if (/phone number.{0,80}(required|invalid|between)/i.test(message)) {
    return 'A participant phone number is missing or invalid. Review the phone fields and try again.';
  }
  if (/team type|participants|solo registration|duo registration/i.test(message)) {
    return 'The participant or team details were rejected. Review the form and try again.';
  }
  if (/idea (title|description|domain)|prototypeAvailable|sketchFilePath/i.test(message)) {
    return 'The startup idea details were rejected. Review the form and try again.';
  }

  return undefined;
}

export function getRegistrationRequestErrorMessage(error: RegistrationRequestError): string {
  switch (error.kind) {
    case 'fetch':
      return 'Could not reach the registration service. Check your connection and try again.';
    case 'relay':
      return 'The registration service could not route the request. Please try again later.';
    case 'unexpected':
      return 'An unexpected registration service error occurred. Please try again.';
    case 'http':
      return getHttpErrorMessage(error.status, error.body);
  }
}

function getHttpErrorMessage(status: number, body: unknown): string {
  if (status === 400) {
    return getSafeValidationMessage(body)
      ?? 'The registration service rejected these details. Review the form and try again.';
  }
  if (status === 401 || status === 403) {
    return `The registration service rejected the request (HTTP ${status}). Refresh the page and try again.`;
  }
  if (status === 413) {
    return 'The registration request is too large.';
  }
  if (status === 429) {
    return 'Too many attempts. Please wait before trying again.';
  }
  if (status === 503) {
    // Could be sketch upload failure or service unavailable
    const serverMsg = getServerErrorText(body);
    if (serverMsg) return serverMsg;
    return 'The registration service is temporarily unavailable. Please try again without a sketch, or try again later.';
  }
  if (status >= 500) {
    // Check if it's a server configuration error (missing env vars in edge function)
    const serverMsg = getServerErrorText(body);
    if (serverMsg?.toLowerCase().includes('configuration')) {
      return 'The registration service is not configured correctly. Please contact the event organizers.';
    }
    return `The registration service encountered a server error. Please try again later or contact the organizers.`;
  }
  return `The registration service rejected the request (HTTP ${status}). Please try again.`;
}
