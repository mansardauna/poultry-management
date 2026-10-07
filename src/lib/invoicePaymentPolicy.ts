/**
 * Server-owned security policy for the public `/api/pay-invoice` endpoint.
 * Kept free of framework/DB imports so it can be unit tested directly.
 */

export const SIMULATED_REF_PREFIXES = ['PAY-SIM-', 'PAY-DIRECT-', 'DEMO-'] as const;

/** Statuses an authenticated farm user may set via the manual reconciliation flow. */
export const STAFF_SETTABLE_STATUSES = ['Unpaid', 'Pending', 'Pending Verification', 'Paid', 'Overdue', 'Cancelled'] as const;

type Env = Record<string, string | undefined>;

export function isSimulatedReference(ref: string): boolean {
  return SIMULATED_REF_PREFIXES.some((p) => ref.startsWith(p));
}

/**
 * Simulated / keyless "verification" is only ever allowed when BOTH:
 *  - NODE_ENV is explicitly 'development' or 'test' (an unset NODE_ENV is treated as production), and
 *  - ALLOW_SIMULATED_PAYMENTS === 'true' (explicit server-side opt-in).
 * The client can never influence this decision.
 */
export function simulatedPaymentsAllowed(env: Env = process.env): boolean {
  const nodeEnv = env.NODE_ENV;
  const nonProd = nodeEnv === 'development' || nodeEnv === 'test';
  return nonProd && env.ALLOW_SIMULATED_PAYMENTS === 'true';
}

export interface OfflineDecisionInput {
  isAuthenticated: boolean;
  action?: string;
  requestedStatus?: unknown;
  currentStatus?: string;
}

export type OfflineDecision =
  | { ok: true; targetStatus: string }
  | { ok: false; status: number; error: string };

/**
 * Decide the resulting invoice status for an offline / manual request.
 * Public (unauthenticated) callers can ONLY move an unpaid invoice to 'Pending Verification'.
 */
export function resolveOfflineDecision({ isAuthenticated, action, requestedStatus, currentStatus }: OfflineDecisionInput): OfflineDecision {
  if (!isAuthenticated) {
    if (action === 'updateStatus') {
      return { ok: false, status: 401, error: 'Unauthorized: Manual status changes require staff or admin authentication.' };
    }
    if (currentStatus === 'Paid') {
      return { ok: false, status: 409, error: 'This invoice is already settled.' };
    }
    return { ok: true, targetStatus: 'Pending Verification' };
  }

  if (requestedStatus === undefined || requestedStatus === null || requestedStatus === '') {
    return { ok: true, targetStatus: 'Paid' };
  }
  if (typeof requestedStatus !== 'string' || !(STAFF_SETTABLE_STATUSES as readonly string[]).includes(requestedStatus)) {
    return { ok: false, status: 400, error: 'Invalid invoice status.' };
  }
  return { ok: true, targetStatus: requestedStatus };
}

/** Strict workspace ownership check (no substring matching, no empty-workspace pass-through). */
export function canModifyWorkspaceInvoice(user: { role: string; workspaceId?: string }, invoiceWorkspaceId?: string): boolean {
  if (user.role === 'SuperAdmin') return true;
  const clean = (v?: string) => (v || '').replace(/"/g, '').trim();
  const userWs = clean(user.workspaceId);
  const invWs = clean(invoiceWorkspaceId);
  return Boolean(userWs && invWs && userWs === invWs);
}

export interface PaystackVerifyPayload {
  status?: boolean;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
    metadata?: unknown;
  };
}

/**
 * Validate a Paystack verify response against the invoice it is being used to settle.
 * Requires: success status, matching reference, sufficient amount, and invoiceId bound in metadata
 * (prevents reusing an unrelated successful transaction on the same Paystack account).
 */
export function validatePaystackVerification(
  payload: PaystackVerifyPayload | null,
  expected: { reference: string; invoiceId: string; totalAmount: number }
): { ok: true } | { ok: false; error: string } {
  const d = payload?.data;
  if (!payload || payload.status !== true || !d || d.status !== 'success') {
    return { ok: false, error: 'Payment verification failed with gateway. Transaction was not confirmed.' };
  }
  if (d.reference && d.reference !== expected.reference) {
    return { ok: false, error: 'Gateway reference mismatch.' };
  }
  const amount = Number(d.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount < Math.round(Number(expected.totalAmount || 0) * 100)) {
    return { ok: false, error: 'Insufficient payment amount detected' };
  }
  let meta: unknown = d.metadata;
  if (typeof meta === 'string') {
    try { meta = JSON.parse(meta); } catch { meta = null; }
  }
  const boundInvoice = meta && typeof meta === 'object' ? (meta as { invoiceId?: unknown }).invoiceId : undefined;
  if (String(boundInvoice ?? '') !== String(expected.invoiceId)) {
    return { ok: false, error: 'This transaction was not issued for this invoice.' };
  }
  return { ok: true };
}

/**
 * Offline references are free-text notes ("Cash with driver"), so they are namespaced per invoice
 * to avoid colliding in the UNIQUE paymentReference column and to stop them squatting gateway refs.
 */
export function storedReferenceFor(isOffline: boolean, invoiceId: string, ref: string): string | null {
  if (!ref) return null;
  const value = isOffline ? `OFFLINE:${invoiceId}:${ref}` : ref;
  return value.slice(0, 255);
}

export function isDuplicateKeyError(err: unknown): boolean {
  if (!err) return false;
  const e = err as { code?: string | number; errno?: number; message?: string };
  return e.code === 'ER_DUP_ENTRY' || e.code === '23505' || e.errno === 1062 || /duplicate (key|entry)/i.test(e.message || '');
}
