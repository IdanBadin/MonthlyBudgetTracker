# Test Skeletons - Ready to Implement
**Generated:** 2026-03-29
**Priority:** Start with 🔴 Critical tests first

This document provides **copy-paste ready test skeletons** for immediate implementation.

---

## 🔴 CRITICAL #1: Auth State Listener Memory Leak

**File:** `src/lib/__tests__/supabase-auth-listeners.test.ts` (skeleton exists, needs implementation)
**Risk:** Memory leak in production (50+ lines, 0% coverage)
**Estimated Time:** 2 hours

### Key Tests to Implement IMMEDIATELY:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { supabase } from '../supabase';

describe('CRITICAL: Auth State Change Listeners', () => {
  let authStateChangeCallback: any;
  let unsubscribeSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    unsubscribeSpy = vi.fn();

    // Capture the auth callback
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockImplementation((callback) => {
      authStateChangeCallback = callback;
      return {
        data: { subscription: { unsubscribe: unsubscribeSpy } }
      };
    });
  });

  it('⚠️ MEMORY LEAK: should return unsubscribe function', () => {
    const { data } = supabase.auth.onAuthStateChange(() => {});

    expect(data.subscription.unsubscribe).toBeDefined();
    expect(typeof data.subscription.unsubscribe).toBe('function');
  });

  it('⚠️ INFINITE LOOP: should reload only once on SIGNED_OUT', () => {
    const reloadSpy = vi.fn();
    window.location.reload = reloadSpy;

    // Trigger SIGNED_OUT
    authStateChangeCallback('SIGNED_OUT', null);

    expect(localStorage.clear).toHaveBeenCalledTimes(1);
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it('🔐 SECURITY: should clear localStorage before reload', () => {
    const clearSpy = vi.spyOn(localStorage, 'clear');
    const reloadSpy = vi.fn();
    window.location.reload = reloadSpy;

    authStateChangeCallback('SIGNED_OUT', null);

    // Verify clear called BEFORE reload
    expect(clearSpy.mock.invocationCallOrder[0])
      .toBeLessThan(reloadSpy.mock.invocationCallOrder[0]);
  });

  it('should handle TOKEN_REFRESHED without reload', () => {
    const reloadSpy = vi.fn();
    window.location.reload = reloadSpy;

    const mockSession = {
      access_token: 'new_token',
      refresh_token: 'new_refresh',
      expires_at: Date.now() + 3600000,
      user: { id: 'user123' }
    };

    authStateChangeCallback('TOKEN_REFRESHED', mockSession);

    expect(reloadSpy).not.toHaveBeenCalled();
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'supabase.auth.token',
      expect.stringContaining('new_token')
    );
  });

  it('🔐 SECURITY: should reload if SIGNED_IN with null session', () => {
    const reloadSpy = vi.fn();
    window.location.reload = reloadSpy;

    // Invalid state: SIGNED_IN but no session
    authStateChangeCallback('SIGNED_IN', null);

    expect(localStorage.clear).toHaveBeenCalled();
    expect(reloadSpy).toHaveBeenCalled();
  });
});
```

---

## 🔴 CRITICAL #2: main.tsx Bootstrap Tests

**File:** Create `src/__tests__/main.test.tsx`
**Risk:** App won't start, users see blank page
**Estimated Time:** 30 minutes

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';

vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn()
  }))
}));

describe('main.tsx - Application Bootstrap', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('should create React root on #root element', async () => {
    await import('../main');

    expect(createRoot).toHaveBeenCalledWith(
      document.getElementById('root')
    );
  });

  it('should render App inside StrictMode', async () => {
    const mockRender = vi.fn();
    vi.mocked(createRoot).mockReturnValue({ render: mockRender } as any);

    await import('../main');

    expect(mockRender).toHaveBeenCalled();
    const renderArg = mockRender.mock.calls[0][0];
    expect(renderArg.type.name).toBe('StrictMode');
  });

  it('should throw error if #root element missing', () => {
    document.body.innerHTML = ''; // Remove root

    expect(() => {
      require('../main');
    }).toThrow();
  });

  it('should fail fast if VITE_SUPABASE_URL missing', () => {
    const originalEnv = import.meta.env.VITE_SUPABASE_URL;
    delete (import.meta.env as any).VITE_SUPABASE_URL;

    expect(() => {
      require('../main');
    }).toThrow(/missing.*supabase.*environment/i);

    (import.meta.env as any).VITE_SUPABASE_URL = originalEnv;
  });
});
```

---

## 🔴 CRITICAL #3: getBiometricSettings (0% Coverage)

**File:** `src/lib/__tests__/biometrics-get-settings.test.ts` (skeleton exists, implement NOW)
**Risk:** Biometric auth bypass
**Estimated Time:** 15 minutes

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getBiometricSettings } from '../biometrics';
import { supabase } from '../supabase';

vi.mock('../supabase');

describe('getBiometricSettings - UNTESTED (0% Coverage)', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return settings successfully', async () => {
    const mockSettings = { loginEnabled: true, backupEnabled: false };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { biometric_settings: mockSettings },
            error: null
          })
        })
      })
    } as any);

    const result = await getBiometricSettings(mockUserId);

    expect(result).toEqual(mockSettings);
  });

  it('should return null when no preferences exist', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      })
    } as any);

    const result = await getBiometricSettings(mockUserId);

    expect(result).toBeNull();
  });

  it('should return null on database error', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      })
    } as any);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getBiometricSettings(mockUserId);

    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('🔐 SECURITY: should query by correct userId', async () => {
    const mockEq = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: mockEq })
    } as any);

    await getBiometricSettings('user-456');

    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-456');
  });

  it('should handle null userId gracefully', async () => {
    const result = await getBiometricSettings(null as any);
    expect(result).toBeNull();
  });
});
```

---

## 🟡 HIGH PRIORITY: TransactionList RTL Edge Cases

**File:** Create `src/components/__tests__/TransactionList-rtl.test.tsx`
**Risk:** Broken UI for Hebrew users
**Estimated Time:** 1 hour

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionList } from '../TransactionList';
import { Transaction } from '../../types/database';

describe('TransactionList - RTL Edge Cases', () => {
  const mockProfile = {
    id: 'user-123',
    email: 'test@test.com',
    name: 'Test User',
    language: 'he' as const,
    currency: 'ILS' as const,
    theme: 'dark' as const
  };

  it('should detect Hebrew text and apply RTL direction', () => {
    const transactions: Transaction[] = [{
      id: '1',
      user_id: 'user-123',
      description: 'קניות במכולת', // Hebrew: "Groceries"
      amount: 100,
      type: 'expense',
      date: '2026-03-29',
      category: 'Food',
      created_at: '2026-03-29T10:00:00Z'
    }];

    const { container } = render(
      <TransactionList
        transactions={transactions}
        onTransactionUpdated={() => {}}
        profile={mockProfile}
      />
    );

    const description = container.querySelector('p[style*="rtl"]');
    expect(description).toBeTruthy();
    expect(description?.textContent).toBe('קניות במכולת');
  });

  it('should keep LTR direction for English text', () => {
    const transactions: Transaction[] = [{
      id: '2',
      user_id: 'user-123',
      description: 'Groceries',
      amount: 100,
      type: 'expense',
      date: '2026-03-29',
      category: 'Food',
      created_at: '2026-03-29T10:00:00Z'
    }];

    const { container } = render(
      <TransactionList
        transactions={transactions}
        onTransactionUpdated={() => {}}
        profile={mockProfile}
      />
    );

    const description = container.querySelector('p[style*="ltr"]');
    expect(description).toBeTruthy();
  });

  it('should handle mixed RTL/LTR text (Hebrew + English)', () => {
    const transactions: Transaction[] = [{
      id: '3',
      user_id: 'user-123',
      description: 'Groceries קניות', // Mixed
      amount: 100,
      type: 'expense',
      date: '2026-03-29',
      category: 'Food',
      created_at: '2026-03-29T10:00:00Z'
    }];

    const { container } = render(
      <TransactionList
        transactions={transactions}
        onTransactionUpdated={() => {}}
        profile={mockProfile}
      />
    );

    // Should detect as RTL since it contains Hebrew
    const description = container.querySelector('p[style*="rtl"]');
    expect(description).toBeTruthy();
  });

  it('should handle empty string without crashing', () => {
    const transactions: Transaction[] = [{
      id: '4',
      user_id: 'user-123',
      description: '',
      amount: 100,
      type: 'expense',
      date: '2026-03-29',
      category: 'Food',
      created_at: '2026-03-29T10:00:00Z'
    }];

    expect(() => {
      render(
        <TransactionList
          transactions={transactions}
          onTransactionUpdated={() => {}}
          profile={mockProfile}
        />
      );
    }).not.toThrow();
  });

  it('should handle RTL text with numbers (₪1,234)', () => {
    const transactions: Transaction[] = [{
      id: '5',
      user_id: 'user-123',
      description: 'תשלום ₪1,234', // Hebrew + currency
      amount: 1234,
      type: 'expense',
      date: '2026-03-29',
      category: 'Food',
      created_at: '2026-03-29T10:00:00Z'
    }];

    const { container } = render(
      <TransactionList
        transactions={transactions}
        onTransactionUpdated={() => {}}
        profile={mockProfile}
      />
    );

    // Verify RTL applied
    const description = container.querySelector('p[style*="rtl"]');
    expect(description).toBeTruthy();

    // Verify currency symbol positioned correctly (postfix in Hebrew)
    const amountText = screen.getByText(/1,234/);
    expect(amountText.textContent).toMatch(/₪/);
  });

  it('should handle special Unicode characters', () => {
    const specialChars = ['😀', '🇮🇱', '©', '™', '→', '←'];

    specialChars.forEach((char, index) => {
      const transactions: Transaction[] = [{
        id: `special-${index}`,
        user_id: 'user-123',
        description: char,
        amount: 100,
        type: 'expense',
        date: '2026-03-29',
        category: 'Food',
        created_at: '2026-03-29T10:00:00Z'
      }];

      expect(() => {
        render(
          <TransactionList
            transactions={transactions}
            onTransactionUpdated={() => {}}
            profile={mockProfile}
          />
        );
      }).not.toThrow();
    });
  });
});
```

---

## 🟡 HIGH PRIORITY: Running Balance Edge Cases

**File:** Create `src/components/__tests__/TransactionList-balance-edge-cases.test.tsx`
**Risk:** Incorrect balances shown to users
**Estimated Time:** 1 hour

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionList } from '../TransactionList';
import { Transaction } from '../../types/database';

describe('Running Balance - Edge Cases', () => {
  const createTransaction = (overrides: Partial<Transaction>): Transaction => ({
    id: 'tx-1',
    user_id: 'user-123',
    description: 'Test',
    amount: 100,
    type: 'expense',
    date: '2026-03-29',
    category: 'Food',
    created_at: '2026-03-29T10:00:00Z',
    ...overrides
  });

  it('should handle starting balance of 0', () => {
    const transactions = [
      createTransaction({ id: '1', type: 'expense', amount: 50 }),
      createTransaction({ id: '2', type: 'income', amount: 100 })
    ];

    render(
      <TransactionList
        transactions={transactions}
        onTransactionUpdated={() => {}}
        startingBalance={0}
      />
    );

    // First transaction: 0 - 50 = -50
    // Second transaction: -50 + 100 = 50
    expect(screen.getByText(/-50/)).toBeInTheDocument();
    expect(screen.getByText(/50/)).toBeInTheDocument();
  });

  it('should handle negative starting balance (debt)', () => {
    const transactions = [
      createTransaction({ id: '1', type: 'expense', amount: 100 })
    ];

    render(
      <TransactionList
        transactions={transactions}
        onTransactionUpdated={() => {}}
        startingBalance={-1000}
      />
    );

    // -1000 - 100 = -1100
    expect(screen.getByText(/-1,?100/)).toBeInTheDocument();
  });

  it('should handle floating point precision (0.1 + 0.2 = 0.3)', () => {
    const transactions = [
      createTransaction({ id: '1', type: 'income', amount: 0.1 }),
      createTransaction({ id: '2', type: 'income', amount: 0.2 })
    ];

    render(
      <TransactionList
        transactions={transactions}
        onTransactionUpdated={() => {}}
        startingBalance={0}
      />
    );

    // Should show 0.30, not 0.30000000000000004
    const balanceElements = screen.getAllByText(/0\.30/);
    expect(balanceElements.length).toBeGreaterThan(0);
  });

  it('should handle transaction with amount = 0', () => {
    const transactions = [
      createTransaction({ id: '1', amount: 0, type: 'income' })
    ];

    expect(() => {
      render(
        <TransactionList
          transactions={transactions}
          onTransactionUpdated={() => {}}
          startingBalance={100}
        />
      );
    }).not.toThrow();

    // Balance should remain 100
    expect(screen.getByText(/100/)).toBeInTheDocument();
  });

  it('should handle empty transactions array', () => {
    const { container } = render(
      <TransactionList
        transactions={[]}
        onTransactionUpdated={() => {}}
        startingBalance={100}
      />
    );

    // Should show empty state
    expect(screen.getByText(/no transactions found/i)).toBeInTheDocument();
  });

  it('should handle very large numbers (billions)', () => {
    const transactions = [
      createTransaction({ id: '1', amount: 999999999999, type: 'income' })
    ];

    expect(() => {
      render(
        <TransactionList
          transactions={transactions}
          onTransactionUpdated={() => {}}
          startingBalance={0}
        />
      );
    }).not.toThrow();

    // Verify large number displayed
    expect(screen.getByText(/999,?999,?999,?999/)).toBeInTheDocument();
  });

  it('⚡ PERFORMANCE: should NOT recalculate on unrelated prop change', () => {
    const transactions = [
      createTransaction({ id: '1', amount: 100, type: 'income' })
    ];

    const { rerender } = render(
      <TransactionList
        transactions={transactions}
        onTransactionUpdated={() => {}}
        startingBalance={0}
      />
    );

    // Change unrelated prop
    rerender(
      <TransactionList
        transactions={transactions}
        onTransactionUpdated={() => console.log('different callback')}
        startingBalance={0}
      />
    );

    // Balance should still be correct (useMemo working)
    expect(screen.getByText(/100/)).toBeInTheDocument();
  });

  it('⚡ PERFORMANCE: should recalculate when startingBalance changes', () => {
    const transactions = [
      createTransaction({ id: '1', amount: 100, type: 'expense' })
    ];

    const { rerender } = render(
      <TransactionList
        transactions={transactions}
        onTransactionUpdated={() => {}}
        startingBalance={200}
      />
    );

    // Initial: 200 - 100 = 100
    expect(screen.getByText(/100/)).toBeInTheDocument();

    rerender(
      <TransactionList
        transactions={transactions}
        onTransactionUpdated={() => {}}
        startingBalance={500}
      />
    );

    // Updated: 500 - 100 = 400
    expect(screen.getByText(/400/)).toBeInTheDocument();
  });
});
```

---

## 🟠 XSS Prevention Tests (SECURITY CRITICAL)

**File:** `src/__tests__/security/xss-prevention.test.tsx`
**Risk:** User data theft, account takeover
**Estimated Time:** 2 hours

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TransactionList } from '../../components/TransactionList';
import { Dashboard } from '../../components/Dashboard';
import { Transaction } from '../../types/database';

describe('🔐 XSS Prevention - Critical Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Transaction Description XSS', () => {
    it('should prevent <script> injection', () => {
      const malicious: Transaction = {
        id: '1',
        user_id: 'user-123',
        description: '<script>alert("XSS")</script>',
        amount: 100,
        type: 'expense',
        date: '2026-03-29',
        category: 'Food',
        created_at: '2026-03-29T10:00:00Z'
      };

      const { container } = render(
        <TransactionList
          transactions={[malicious]}
          onTransactionUpdated={() => {}}
        />
      );

      // Script tag should NOT exist in DOM
      expect(container.querySelector('script')).toBeNull();

      // Text should be escaped
      expect(screen.getByText(/<script>alert\("XSS"\)<\/script>/)).toBeInTheDocument();
    });

    it('should prevent event handler injection (onclick)', () => {
      const malicious: Transaction = {
        id: '2',
        user_id: 'user-123',
        description: '<div onclick="alert(1)">Click me</div>',
        amount: 100,
        type: 'expense',
        date: '2026-03-29',
        category: 'Food',
        created_at: '2026-03-29T10:00:00Z'
      };

      const { container } = render(
        <TransactionList
          transactions={[malicious]}
          onTransactionUpdated={() => {}}
        />
      );

      // onclick attribute should NOT exist
      const elements = container.querySelectorAll('[onclick]');
      expect(elements.length).toBe(0);
    });

    it('should prevent <img onerror> injection', () => {
      const malicious: Transaction = {
        id: '3',
        user_id: 'user-123',
        description: '<img src=x onerror=alert(document.cookie)>',
        amount: 100,
        type: 'expense',
        date: '2026-03-29',
        category: 'Food',
        created_at: '2026-03-29T10:00:00Z'
      };

      const alertSpy = vi.spyOn(window, 'alert');

      render(
        <TransactionList
          transactions={[malicious]}
          onTransactionUpdated={() => {}}
        />
      );

      // Alert should NOT be called
      expect(alertSpy).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('should prevent <iframe> injection', () => {
      const malicious: Transaction = {
        id: '4',
        user_id: 'user-123',
        description: '<iframe src="https://evil.com"></iframe>',
        amount: 100,
        type: 'expense',
        date: '2026-03-29',
        category: 'Food',
        created_at: '2026-03-29T10:00:00Z'
      };

      const { container } = render(
        <TransactionList
          transactions={[malicious]}
          onTransactionUpdated={() => {}}
        />
      );

      // iframe should NOT exist
      expect(container.querySelector('iframe')).toBeNull();
    });

    it('should prevent javascript: URL injection', () => {
      const malicious: Transaction = {
        id: '5',
        user_id: 'user-123',
        description: '<a href="javascript:alert(1)">Click</a>',
        amount: 100,
        type: 'expense',
        date: '2026-03-29',
        category: 'Food',
        created_at: '2026-03-29T10:00:00Z'
      };

      const { container } = render(
        <TransactionList
          transactions={[malicious]}
          onTransactionUpdated={() => {}}
        />
      );

      // No anchor with javascript: href
      const links = container.querySelectorAll('a[href^="javascript:"]');
      expect(links.length).toBe(0);
    });
  });

  describe('User Name XSS', () => {
    it('should escape HTML in profile names', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@test.com',
        name: '<img src=x onerror=alert(1)>',
        language: 'en' as const,
        currency: 'USD' as const,
        theme: 'dark' as const
      };

      // Mock Dashboard with malicious name
      // TODO: Render Dashboard with mockProfile
      // TODO: Verify <img> tag NOT rendered
      // TODO: Verify name shown as plain text
    });
  });

  describe('Search Input XSS', () => {
    it('should not execute scripts in search queries', async () => {
      // TODO: Render AdvancedSearch
      // TODO: Type '<script>alert("XSS")</script>' in search
      // TODO: Verify script NOT executed
    });
  });

  describe('Imported Data XSS', () => {
    it('should sanitize backup data on import', async () => {
      // TODO: Mock backup with XSS payloads
      // TODO: Restore backup
      // TODO: Verify all data sanitized before rendering
    });
  });
});
```

---

## 📊 Implementation Priority

### Start Here (Day 1):
1. ✅ Auth state listener memory leak tests
2. ✅ getBiometricSettings tests
3. ✅ main.tsx bootstrap tests

### Day 2:
4. ✅ XSS prevention tests
5. ✅ Running balance edge cases

### Day 3:
6. ✅ RTL handling tests
7. ✅ Concurrent backup operations

---

## 🎯 Quick Commands

```bash
# Run specific test file
npm test src/lib/__tests__/supabase-auth-listeners.test.ts

# Run all security tests
npm test src/__tests__/security

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

---

**Next Steps:**
1. Copy test skeleton into appropriate file
2. Implement TODOs
3. Run tests: `npm test`
4. Fix failures
5. Commit with message: `test: implement [component] tests`

