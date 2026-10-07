import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { rateLimit, getClientIp } from '../src/lib/rateLimit';
import { isSimulatedReference, simulatedPaymentsAllowed, resolveOfflineDecision, canModifyWorkspaceInvoice, validatePaystackVerification, storedReferenceFor, isDuplicateKeyError } from '../src/lib/invoicePaymentPolicy';
import { formatCompactNumber, formatCompactCurrency } from '../src/lib/currency';

describe('Security & Rate Limiting Suite', () => {
  test('rateLimit permits requests within threshold', () => {
    const key = `test_perm_${Date.now()}`;
    const r1 = rateLimit(key, { windowMs: 1000, max: 3 });
    assert.equal(r1.success, true);
    assert.equal(r1.remaining, 2);

    const r2 = rateLimit(key, { windowMs: 1000, max: 3 });
    assert.equal(r2.success, true);
    assert.equal(r2.remaining, 1);

    const r3 = rateLimit(key, { windowMs: 1000, max: 3 });
    assert.equal(r3.success, true);
    assert.equal(r3.remaining, 0);
  });

  test('rateLimit blocks requests exceeding threshold and gives retryAfterSeconds', () => {
    const key = `test_block_${Date.now()}`;
    rateLimit(key, { windowMs: 5000, max: 2 });
    rateLimit(key, { windowMs: 5000, max: 2 });

    const blocked = rateLimit(key, { windowMs: 5000, max: 2 });
    assert.equal(blocked.success, false);
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.retryAfterSeconds > 0 && blocked.retryAfterSeconds <= 5);
  });

  test('getClientIp extracts IP correctly from forwarded headers', () => {
    const req1 = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' }
    });
    assert.equal(getClientIp(req1), '203.0.113.195');

    const req2 = new Request('http://localhost', {
      headers: { 'x-real-ip': '198.51.100.4' }
    });
    assert.equal(getClientIp(req2), '198.51.100.4');

    const req3 = new Request('http://localhost', {
      headers: { 'cf-connecting-ip': '192.0.2.1' }
    });
    assert.equal(getClientIp(req3), '192.0.2.1');

    const reqFallback = new Request('http://localhost');
    assert.equal(getClientIp(reqFallback), '127.0.0.1');
  });
});

describe('SuperAdmin Email Reservation Suite', () => {
  const RESERVED_SUPERADMIN_EMAILS = [
    'owner@poultry.com',
    'superadmin@pfms.com',
    'admin@pfms.com',
    'superadmin@poultry.com',
  ];

  function isReservedEmail(email: string): boolean {
    const clean = email.trim().toLowerCase();
    return RESERVED_SUPERADMIN_EMAILS.includes(clean) ||
      clean.startsWith('superadmin@') ||
      clean === 'owner@poultry.com';
  }

  test('rejects registration of reserved administrative emails', () => {
    assert.equal(isReservedEmail('owner@poultry.com'), true);
    assert.equal(isReservedEmail('superadmin@pfms.com'), true);
    assert.equal(isReservedEmail('superadmin@customdomain.com'), true);
    assert.equal(isReservedEmail('admin@pfms.com'), true);
  });

  test('allows standard customer emails', () => {
    assert.equal(isReservedEmail('farmer_john@gmail.com'), false);
    assert.equal(isReservedEmail('manager@poultryfarm.org'), false);
  });
});

describe('Invoice Payment Reference Idempotency Suite', () => {
  test('rejects reused transaction references across different invoices', () => {
    const mockDb = [
      { id: 'inv_101', paymentReference: 'PAY-REF-999888', status: 'Paid' },
      { id: 'inv_102', paymentReference: null, status: 'Unpaid' }
    ];

    function canClaimReference(targetInvoiceId: string, ref: string): { allowed: boolean; reason?: string } {
      const trimmed = ref.trim();
      const existing = mockDb.find(i => i.paymentReference === trimmed && i.id !== targetInvoiceId);
      if (existing) {
        return {
          allowed: false,
          reason: `Payment reference '${trimmed}' already consumed by invoice #${existing.id}`
        };
      }
      return { allowed: true };
    }

    // Replay of existing reference
    const replayCheck = canClaimReference('inv_102', 'PAY-REF-999888');
    assert.equal(replayCheck.allowed, false);
    assert.ok(replayCheck.reason?.includes('already consumed'));

    // Re-verify of same invoice is permitted
    const sameInvoice = canClaimReference('inv_101', 'PAY-REF-999888');
    assert.equal(sameInvoice.allowed, true);

    // Fresh new reference
    const freshCheck = canClaimReference('inv_102', 'PAY-REF-111222');
    assert.equal(freshCheck.allowed, true);
  });
});

describe('Proxy Prefix Security Boundary Suite', () => {
  const PUBLIC_API_PREFIXES = [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/reset-password',
    '/api/setup',
    '/api/pay-invoice',
  ];

  function matchesPublicPrefix(path: string): boolean {
    return PUBLIC_API_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix + '/'));
  }

  test('strictly matches valid public routes with slash boundaries', () => {
    assert.equal(matchesPublicPrefix('/api/setup'), true);
    assert.equal(matchesPublicPrefix('/api/setup/status'), true);
    assert.equal(matchesPublicPrefix('/api/auth/login'), true);
    assert.equal(matchesPublicPrefix('/api/pay-invoice'), true);
  });

  test('rejects path boundary bypass attempts', () => {
    assert.equal(matchesPublicPrefix('/api/setup-unauthorized'), false);
    assert.equal(matchesPublicPrefix('/api/setup.php'), false);
    assert.equal(matchesPublicPrefix('/api/pay-invoice-fake'), false);
    assert.equal(matchesPublicPrefix('/api/auth/login_bypass'), false);
  });
});

describe('Invoice Settlement Security Policy Suite', () => {
  test('simulated payments require non-production NODE_ENV AND explicit opt-in', () => {
    assert.equal(isSimulatedReference('PAY-SIM-999888'), true);
    assert.equal(isSimulatedReference('PAY-DIRECT-1'), true);
    assert.equal(isSimulatedReference('DEMO-1'), true);
    assert.equal(isSimulatedReference('PAY-1700000000-ab12'), false);

    assert.equal(simulatedPaymentsAllowed({ NODE_ENV: 'production', ALLOW_SIMULATED_PAYMENTS: 'true' }), false);
    assert.equal(simulatedPaymentsAllowed({ ALLOW_SIMULATED_PAYMENTS: 'true' }), false); // unset NODE_ENV => prod
    assert.equal(simulatedPaymentsAllowed({ NODE_ENV: 'development' }), false); // no opt-in
    assert.equal(simulatedPaymentsAllowed({ NODE_ENV: 'development', ALLOW_SIMULATED_PAYMENTS: 'true' }), true);
    assert.equal(simulatedPaymentsAllowed({ NODE_ENV: 'test', ALLOW_SIMULATED_PAYMENTS: 'true' }), true);
  });

  test('public offline submissions can never settle an invoice', () => {
    const d1 = resolveOfflineDecision({ isAuthenticated: false, action: 'offlinePayment', requestedStatus: 'Paid' });
    assert.deepEqual(d1, { ok: true, targetStatus: 'Pending Verification' });

    const d2 = resolveOfflineDecision({ isAuthenticated: false, action: 'offlinePayment' });
    assert.deepEqual(d2, { ok: true, targetStatus: 'Pending Verification' });

    const d3 = resolveOfflineDecision({ isAuthenticated: false, action: 'updateStatus', requestedStatus: 'Paid' });
    assert.equal(d3.ok, false);
    if (!d3.ok) assert.equal(d3.status, 401);

    // Cannot downgrade an already-paid invoice
    const d4 = resolveOfflineDecision({ isAuthenticated: false, action: 'offlinePayment', currentStatus: 'Paid' });
    assert.equal(d4.ok, false);
  });

  test('authenticated staff may only set whitelisted statuses', () => {
    assert.deepEqual(resolveOfflineDecision({ isAuthenticated: true }), { ok: true, targetStatus: 'Paid' });
    assert.deepEqual(resolveOfflineDecision({ isAuthenticated: true, requestedStatus: 'Unpaid' }), { ok: true, targetStatus: 'Unpaid' });
    assert.equal(resolveOfflineDecision({ isAuthenticated: true, requestedStatus: 'Hacked' }).ok, false);
    assert.equal(resolveOfflineDecision({ isAuthenticated: true, requestedStatus: { $ne: 1 } }).ok, false);
  });

  test('workspace ownership check is strict', () => {
    assert.equal(canModifyWorkspaceInvoice({ role: 'Admin', workspaceId: 'ws1' }, 'ws1'), true);
    assert.equal(canModifyWorkspaceInvoice({ role: 'Admin', workspaceId: 'ws1' }, 'ws12'), false);
    assert.equal(canModifyWorkspaceInvoice({ role: 'Admin' }, 'ws1'), false);
    assert.equal(canModifyWorkspaceInvoice({ role: 'Staff', workspaceId: '' }, ''), false);
    assert.equal(canModifyWorkspaceInvoice({ role: 'SuperAdmin' }, 'ws1'), true);
  });

  test('Paystack verification is bound to invoice, reference and amount', () => {
    const expected = { reference: 'PAY-1', invoiceId: 'inv1', totalAmount: 1000 };
    const good = { status: true, data: { status: 'success', reference: 'PAY-1', amount: 100000, metadata: { invoiceId: 'inv1' } } };
    assert.equal(validatePaystackVerification(good, expected).ok, true);
    assert.equal(validatePaystackVerification({ ...good, data: { ...good.data, metadata: '{"invoiceId":"inv1"}' } }, expected).ok, true);
    assert.equal(validatePaystackVerification({ ...good, data: { ...good.data, status: 'failed' } }, expected).ok, false);
    assert.equal(validatePaystackVerification({ ...good, data: { ...good.data, amount: 99999 } }, expected).ok, false);
    assert.equal(validatePaystackVerification({ ...good, data: { ...good.data, amount: undefined } }, expected).ok, false);
    assert.equal(validatePaystackVerification({ ...good, data: { ...good.data, metadata: { invoiceId: 'other' } } }, expected).ok, false);
    assert.equal(validatePaystackVerification({ ...good, data: { ...good.data, metadata: '' } }, expected).ok, false);
    assert.equal(validatePaystackVerification({ ...good, data: { ...good.data, reference: 'PAY-2' } }, expected).ok, false);
    assert.equal(validatePaystackVerification(null, expected).ok, false);
  });

  test('offline notes are namespaced per invoice; duplicate-key errors detected', () => {
    assert.equal(storedReferenceFor(true, 'inv1', 'Cash with driver'), 'OFFLINE:inv1:Cash with driver');
    assert.equal(storedReferenceFor(false, 'inv1', 'PAY-1'), 'PAY-1');
    assert.equal(storedReferenceFor(true, 'inv1', ''), null);
    assert.equal(isDuplicateKeyError({ code: 'ER_DUP_ENTRY' }), true);
    assert.equal(isDuplicateKeyError({ code: '23505' }), true);
    assert.equal(isDuplicateKeyError(new Error('boom')), false);
  });
});

describe('Compact Number and Currency Formatting Suite', () => {
  test('formats numbers with K, M, B abbreviations', () => {
    assert.equal(formatCompactNumber(0), '0');
    assert.equal(formatCompactNumber(500), '500');
    assert.equal(formatCompactNumber(1000), '1K');
    assert.equal(formatCompactNumber(1500), '1.5K');
    assert.equal(formatCompactNumber(15000), '15K');
    assert.equal(formatCompactNumber(150000), '150K');
    assert.equal(formatCompactNumber(1000000), '1M');
    assert.equal(formatCompactNumber(2500000), '2.5M');
    assert.equal(formatCompactNumber(1000000000), '1B');
    assert.equal(formatCompactNumber(3200000000), '3.2B');
  });

  test('formats currency amounts with symbols and compact notation', () => {
    assert.equal(formatCompactCurrency(15000, '$'), '$15K');
    assert.equal(formatCompactCurrency(1500000, '₦'), '₦1.5M');
    assert.equal(formatCompactCurrency(5000000000, '€'), '€5B');
    assert.equal(formatCompactCurrency(45, '$'), '$45');
  });
});

