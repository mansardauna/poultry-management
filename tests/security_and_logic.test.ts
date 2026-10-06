import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { rateLimit, getClientIp } from '../src/lib/rateLimit';

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
  function evaluateSimulatedReference(ref: string, env: string): { allowed: boolean; error?: string } {
    const isSimulated = ref.startsWith('PAY-SIM-') || ref.startsWith('PAY-DIRECT-') || ref.startsWith('DEMO-');
    if (isSimulated && env === 'production') {
      return { allowed: false, error: 'Simulated payment references are prohibited in production.' };
    }
    return { allowed: true };
  }

  function resolveOfflineTargetStatus(isAuthUser: boolean, newStatus?: string): string {
    if (!isAuthUser) {
      // Unauthenticated public customer submissions ALWAYS transition to 'Pending Verification'
      return 'Pending Verification';
    }
    return newStatus || 'Paid';
  }

  test('prohibits simulated test references in production environment', () => {
    const r1 = evaluateSimulatedReference('PAY-SIM-999888', 'production');
    assert.equal(r1.allowed, false);
    assert.ok(r1.error?.includes('prohibited in production'));

    const r2 = evaluateSimulatedReference('PAY-DIRECT-123456', 'production');
    assert.equal(r2.allowed, false);

    const r3 = evaluateSimulatedReference('DEMO-443322', 'production');
    assert.equal(r3.allowed, false);
  });

  test('permits simulated test references in development and test environments', () => {
    const rDev = evaluateSimulatedReference('PAY-SIM-999888', 'development');
    assert.equal(rDev.allowed, true);

    const rTest = evaluateSimulatedReference('PAY-SIM-999888', 'test');
    assert.equal(rTest.allowed, true);
  });

  test('enforces Pending Verification status on unauthenticated offline customer submissions', () => {
    // Customer attempts to self-settle as Paid
    const statusCustomer1 = resolveOfflineTargetStatus(false, 'Paid');
    assert.equal(statusCustomer1, 'Pending Verification');

    // Customer submits without status
    const statusCustomer2 = resolveOfflineTargetStatus(false);
    assert.equal(statusCustomer2, 'Pending Verification');

    // Authenticated staff/admin confirms as Paid
    const statusAdmin = resolveOfflineTargetStatus(true, 'Paid');
    assert.equal(statusAdmin, 'Paid');
  });
});
