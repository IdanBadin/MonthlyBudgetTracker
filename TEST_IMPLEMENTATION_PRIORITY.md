# Test Implementation Priority

## Phase 1: Critical Security & Memory Leaks (Today)

### 1.1 Auth Listener Memory Leak ⚠️ BLOCKING
**File**: `src/lib/__tests__/supabase-auth-listeners.test.ts`
**Impact**: Production memory leak
**Time**: 2 hours

```typescript
describe('Auth Listener Cleanup', () => {
  it('should unsubscribe auth listener on cleanup', () => {
    const unsubscribe = vi.fn();
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
      data: { subscription: { unsubscribe } }
    });

    const { unmount } = render(<App />);
    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
```

**Action Required**: Fix the actual code in `src/lib/supabase.ts:116` to store and call unsubscribe.

### 1.2 Row Level Security (RLS)
**File**: `src/__tests__/database-constraints.test.ts`
**Impact**: Data security breach risk
**Time**: 3 hours

```typescript
describe('RLS Policies', () => {
  it('should prevent user A from reading user B transactions', async () => {
    // Sign in as user A
    await supabase.auth.signInWithPassword({
      email: 'userA@test.com',
      password: 'password123'
    });

    // Try to query user B's data
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', 'userB-uuid');

    // Should return empty due to RLS
    expect(data).toEqual([]);
  });

  it('should prevent user A from updating user B profile', async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ name: 'Hacked' })
      .eq('id', 'userB-uuid');

    // Should fail or return 0 rows affected
    expect(error || data.length).toBeTruthy();
  });
});
```

### 1.3 getBiometricSettings() - 0% Coverage
**File**: `src/lib/__tests__/biometrics-get-settings.test.ts`
**Impact**: Security-critical function untested
**Time**: 1 hour

```typescript
describe('getBiometricSettings', () => {
  it('should return default settings when user has none', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { biometric_settings: null },
            error: null
          })
        })
      })
    } as any);

    const result = await getBiometricSettings('user-123');

    expect(result).toEqual({
      loginEnabled: false,
      backupEnabled: false
    });
  });

  it('should handle null/undefined userId gracefully', async () => {
    const result = await getBiometricSettings(null as any);
    expect(result).toEqual({ loginEnabled: false, backupEnabled: false });
  });
});
```

---

## Phase 2: Performance Regression Prevention (This Week)

### 2.1 TransactionList O(n²) Prevention
**File**: `src/__tests__/performance/performance-regression.test.ts`
**Impact**: Prevent regression of recent fix
**Time**: 2 hours

```typescript
describe('TransactionList Performance', () => {
  const generateTransactions = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      id: `tx-${i}`,
      amount: 100,
      type: 'expense',
      date: '2026-03-29',
      description: `Transaction ${i}`,
      category: 'Food'
    }));

  it('should scale linearly, not quadratically', () => {
    const start100 = performance.now();
    render(<TransactionList transactions={generateTransactions(100)} />);
    const time100 = performance.now() - start100;

    const start1000 = performance.now();
    render(<TransactionList transactions={generateTransactions(1000)} />);
    const time1000 = performance.now() - start1000;

    const scalingFactor = time1000 / time100;

    // O(n): 10x data → ~10x time (allow 20x for overhead)
    // O(n²): 10x data → ~100x time
    expect(scalingFactor).toBeLessThan(20);
  });

  it('should memoize running balance calculation', () => {
    const calcSpy = vi.fn();
    const transactions = generateTransactions(100);

    const { rerender } = render(
      <TransactionList transactions={transactions} />
    );

    // Force re-render without changing transactions
    rerender(<TransactionList transactions={transactions} />);

    // Balance calc should NOT run again (useMemo)
    expect(calcSpy).toHaveBeenCalledTimes(1);
  });
});
```

### 2.2 Backup Data Integrity
**File**: `src/lib/__tests__/backup.test.ts`
**Impact**: Prevent data loss
**Time**: 3 hours

```typescript
describe('createBackup', () => {
  it('should filter data by retention period correctly', async () => {
    const transactions = [
      { date: '2025-09-01' }, // 6 months old
      { date: '2026-03-01' }  // Current month
    ];

    // Mock profile with 3-month retention
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { data_retention_months: 3 },
                error: null
              })
            })
          })
        };
      }
      // ... mock transactions query
    });

    await createBackup('user-123', 'manual');

    // Verify only last 3 months included
    const insertCall = vi.mocked(supabase.from).mock.calls
      .find(c => c[0] === 'data_backups');

    const backupData = insertCall.backup_data;
    expect(backupData.transactions).toHaveLength(1);
    expect(backupData.transactions[0].date).toBe('2026-03-01');
  });

  it('should keep only last 10 backups', async () => {
    // Mock 15 existing backups
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'data_backups' && method === 'select') {
        return Promise.resolve({
          data: Array.from({ length: 15 }, (_, i) => ({
            id: `backup-${i}`,
            created_at: new Date(2026, 0, i + 1).toISOString()
          })),
          error: null
        });
      }
    });

    await createBackup('user-123', 'auto');

    // Verify 5 oldest deleted
    const deleteCalls = vi.mocked(supabase.from).mock.calls
      .filter(c => c[0] === 'data_backups' && c[1] === 'delete');

    expect(deleteCalls).toHaveLength(1);
    expect(deleteCalls[0].ids).toHaveLength(5);
  });
});

describe('restoreFromBackup', () => {
  it('should prevent user A from restoring user B backup', async () => {
    // Mock backup belonging to user B
    vi.mocked(supabase.from).mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: { user_id: 'userB', backup_data: {} },
            error: null
          })
        })
      })
    });

    const result = await restoreFromBackup('userA', 'backup-id');

    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('security')
    );
  });
});
```

---

## Phase 3: Integration & E2E (Next Week)

### 3.1 Auth Flow Integration
**File**: `src/__tests__/integration/auth-flow.test.ts`
**Time**: 4 hours

```typescript
describe('Complete Auth Flow', () => {
  it('should complete signup → signin → biometric setup → signout', async () => {
    // 1. Sign up
    const { data } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'Test123!@#'
    });
    expect(data.user).toBeDefined();

    // 2. Sign in
    await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'Test123!@#'
    });

    // 3. Enable biometrics
    const registered = await registerBiometrics(data.user.id);
    expect(registered).toBe(true);

    // 4. Sign out
    await supabase.auth.signOut();

    // 5. Verify can sign back in with biometrics
    const verified = await verifyBiometrics(data.user.id);
    expect(verified).toBe(true);
  });
});
```

### 3.2 Backup Flow Integration
**File**: `src/__tests__/integration/backup-flow.test.ts`
**Time**: 3 hours

### 3.3 Network Resilience
**File**: `src/__tests__/integration/network-resilience.test.ts`
**Time**: 4 hours

---

## Phase 4: Security & XSS (Next Week)

### 4.1 XSS Prevention
**File**: `src/__tests__/security/security.test.ts`
**Time**: 3 hours

```typescript
describe('XSS Prevention', () => {
  it('should sanitize transaction descriptions with script tags', async () => {
    const maliciousDesc = '<script>alert("XSS")</script>';

    await supabase.from('transactions').insert({
      description: maliciousDesc,
      amount: 100,
      type: 'expense'
    });

    const { container } = render(<TransactionList />);

    // Should display as plain text, not execute
    expect(container.innerHTML).not.toContain('<script>');
    expect(container.textContent).toContain('&lt;script&gt;');
  });

  it('should prevent XSS in search queries', () => {
    const { getByRole } = render(<AdvancedSearch />);
    const input = getByRole('textbox');

    fireEvent.change(input, {
      target: { value: '"><script>alert(1)</script>' }
    });

    expect(document.querySelector('script')).toBeNull();
  });
});
```

### 4.2 SQL Injection Prevention
**Time**: 2 hours

---

## Summary

| Phase | Tests | Time | Priority |
|-------|-------|------|----------|
| **Phase 1** | 3 critical files | **6 hours** | 🔴 URGENT |
| **Phase 2** | 2 performance files | **5 hours** | 🟡 HIGH |
| **Phase 3** | 3 integration files | **11 hours** | 🟢 MEDIUM |
| **Phase 4** | 2 security files | **5 hours** | 🟡 HIGH |

**Total**: 27 hours of test implementation

---

## Quick Win: Start with These 3 Tests

1. **Auth listener cleanup** (30 min) - Fixes production memory leak
2. **getBiometricSettings null check** (15 min) - Prevents crashes
3. **TransactionList performance** (45 min) - Prevents regression

These 3 tests cover the most critical risks with minimal effort.
