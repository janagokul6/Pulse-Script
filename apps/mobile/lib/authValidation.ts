/**
 * Client-side auth validation and user-friendly error messages.
 */

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export type ValidationResult = { valid: true } | { valid: false; message: string };

export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (!trimmed) return { valid: false, message: 'Please enter your email address.' };
  if (!EMAIL_REGEX.test(trimmed)) return { valid: false, message: 'Please enter a valid email address.' };
  return { valid: true };
}

export function validateAuthForm(email: string): ValidationResult {
  return validateEmail(email);
}

const CLERK_CODES: Record<string, string> = {
  form_identifier_not_found: 'No account found — we\u2019ll create one for you.',
  form_identifier_invalid: 'Please enter a valid email address.',
  form_param_format_invalid: 'Please check your email and try again.',
  form_code_incorrect: 'Incorrect code. Please check and try again.',
  verification_expired: 'Code expired. Please request a new one.',
  verification_failed: 'Verification failed. Please try again.',
};

export function toFriendlyAuthMessage(
  rawMessage: string | undefined,
  _field?: string,
): string | null {
  if (!rawMessage || typeof rawMessage !== 'string') return null;
  const lower = rawMessage.toLowerCase().trim();

  for (const [code, friendly] of Object.entries(CLERK_CODES)) {
    if (lower.includes(code) || lower === code) return friendly;
  }

  if (lower.includes('identifier') && (lower.includes('invalid') || lower.includes('format')))
    return 'Please enter a valid email address.';
  if (lower.includes('not found') || lower.includes('no account'))
    return 'No account found — we\u2019ll create one for you.';
  if (lower.includes('already exists') || lower.includes('taken'))
    return 'An account with this email already exists.';
  if (lower.includes('incorrect') && lower.includes('code'))
    return 'Incorrect code. Please check and try again.';
  if (lower.includes('expired'))
    return 'Code expired. Please request a new one.';

  return 'Something went wrong. Please try again.';
}
