export type StatusPillModifier = 'success' | 'error' | 'pending' | 'neutral';

const SUCCESS_CODES = new Set(['APPROVED']);
const ERROR_CODES = new Set(['REJECTED', 'ERROR', 'EXPIRED']);
const PENDING_CODES = new Set(['PENDING']);

// Maps the transaction/catalog status codes used across the backend
// (transaction_statuses seed, hasCredentials/isActive flags) to one of the
// four visual modifiers of `.status-pill` in styles.scss.
export function statusPillModifier(code: string): StatusPillModifier {
  const normalized = code.toUpperCase();
  if (SUCCESS_CODES.has(normalized)) {
    return 'success';
  }
  if (ERROR_CODES.has(normalized)) {
    return 'error';
  }
  if (PENDING_CODES.has(normalized)) {
    return 'pending';
  }
  return 'neutral';
}

export function booleanPillModifier(value: boolean): StatusPillModifier {
  return value ? 'success' : 'neutral';
}
