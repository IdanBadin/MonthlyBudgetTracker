# Test Coverage Gap Analysis
**Generated:** 2026-03-29

## Executive Summary

**Current Coverage:** ~15% (skeleton files only, minimal implementation)
**Target Coverage:** 80%+

### Critical Gaps
1. **15 components** have NO test files
2. **All library modules** have skeleton tests only (0% implemented)
3. **Integration tests** are 100% TODO placeholders
4. **E2E tests** do not exist
5. **Error boundary tests** missing
6. **Accessibility tests** missing

---

## 1. Library Module Gaps (`src/lib/`)

### 1.1 backup.ts — Missing Tests

#### Untested Functions
- ✅ createBackup — has skeletons but not implemented
- ✅ restoreFromBackup — has skeletons but not implemented

#### Critical Missing Scenarios
1. **Atomic Transactions**
   - No test for rollback on partial restore failure
   - No test for database transaction boundaries

2. **Network Resilience**
   - Network interruption during backup creation
   - Timeout during large backup upload
   - Browser/tab close during backup operation

3. **Data Validation**
   - Backup with circular references in JSON
   - Backup with invalid date formats
   - Backup with missing required fields

4. **Performance**
   - Backup with 50k+ transactions
   - Restore with pagination vs single batch
   - Memory usage during large restore

5. **User Experience**
   - Progress callbacks during long operations
   - Cancelable backup/restore operations
   - Backup queue management (multiple simultaneous requests)

---

### 1.2 biometrics.ts — Missing Tests

#### Untested Function
❌ **`getBiometricSettings(userId: string)`** — NO TESTS AT ALL

#### Critical Missing Scenarios
1. **Biometric Hardware**
   - Biometric sensor failure mid-verification
   - Device switching from fingerprint to Face ID
   - External USB biometric device disconnect

2. **Credential Lifecycle**
   - Credential expiration (if platform supports)
   - Credential revocation by OS
   - User disabling biometrics in OS settings

3. **Security**
   - Biometric spoof attempt detection
   - Rate limiting after failed attempts
   - Credential export prevention

4. **User Flows**
   - Registration → logout → login flow
   - Registration on device A → login on device B (should fail)
   - Re-registration overwriting old credential

---

### 1.3 i18n.ts — Missing Tests

#### Untested Functions
❌ **`useTranslation()` hook** — only inferred, not tested
❌ **`useFormatCurrency()` hook** — only inferred, not tested
❌ **Any formatting utility functions**

#### Critical Missing Scenarios
1. **Component Integration**
   - No tests with actual React components
   - No tests for language switching in mounted components
   - No tests for currency changes updating displayed values

2. **Edge Cases**
   - Translating keys with nested placeholders: `{user.name}`
   - Translation strings with HTML entities: `&amp;`, `&lt;`
   - Very long translation strings (1000+ chars)
   - Emoji in translation strings

3. **Performance**
   - Translation lookup performance (10k+ keys)
   - Memoization effectiveness
   - Re-render count on language change

4. **Fallback Behavior**
   - Partial Hebrew translation (some keys missing)
   - Invalid language code: `'fr'`
   - Translation key typos

---

### 1.4 supabase.ts — Missing Tests

#### Untested Code
❌ **Auth state change listeners** (50+ lines of code, 0% tested)
❌ **Session initialization** (`supabase.auth.getSession()`)
❌ **Custom fetch wrapper** with retry

#### Critical Missing Scenarios
1. **Session Management**
   - Session expires while user is idle
   - Token refresh during active operation
   - Multiple tabs — sign out in one, others should react

2. **Error Recovery**
   - `session_not_found` → should clear storage + reload
   - `invalid_refresh_token` → should clear + reload
   - Network failure during token refresh

3. **Race Conditions**
   - Concurrent requests during token refresh
   - Sign out during pending request
   - Multiple token refresh attempts simultaneously

4. **Storage Edge Cases**
   - localStorage quota exceeded during session save
   - Corrupted session data in localStorage
   - localStorage disabled by browser settings

---

### 1.5 updateProfile.ts — Missing Tests

#### Minimal Coverage
Only 14 test skeletons for a single function — but:

❌ **No tests for actual return value structure**
❌ **No integration with profile creation flow**
❌ **No tests with special characters:** O'Brien, 李明, José

#### Critical Missing Scenarios
1. **Validation**
   - Name with only whitespace: `"   "`
   - Name with newlines: `"John\nDoe"`
   - Name with SQL: `"Robert'); DROP TABLE profiles;--"`

2. **Edge Cases**
   - Email changed externally between read and update (race condition)
   - Multiple updates in rapid succession (debouncing?)
   - Update during active transaction

---

## 2. Component Test Gaps (`src/components/`)

### 2.1 UNTESTED Components (15 total)

#### Critical Priority (Auth & Settings)
1. ❌ **AuthForm.tsx**
   - Email/password validation
   - Google OAuth flow
   - Error display
   - Loading states
   - Sign in/sign up toggle

2. ❌ **BiometricSetup.tsx**
   - Registration flow
   - Error handling
   - Browser compatibility messaging
   - Settings toggle

3. ❌ **SettingsModal.tsx**
   - Language switching
   - Currency switching
   - Theme switching
   - Data retention changes
   - Save/cancel behavior

#### High Priority (Transaction Management)
4. ❌ **TransactionForm.tsx**
   - Amount validation
   - Category selection
   - Date picker integration
   - Submit/cancel
   - Edit mode vs create mode

5. ❌ **TransactionList.tsx**
   - Rendering 1000+ transactions (performance)
   - Filtering
   - Sorting
   - Selection
   - Delete confirmation

6. ❌ **TransactionDetailsModal.tsx**
   - Display all transaction fields
   - Edit button
   - Delete button
   - Close behavior

7. ❌ **InternalTransferForm.tsx**
   - Account selection
   - Amount validation
   - Date selection
   - Submit validation

8. ❌ **InternalTransferList.tsx**
   - Display transfers
   - Edit/delete
   - Filtering

#### Medium Priority (UI Components)
9. ❌ **AdvancedSearch.tsx**
   - Filter building
   - Saved filters CRUD
   - Apply/reset behavior
   - Filter persistence

10. ❌ **BackupRestoreModal.tsx**
    - Backup creation flow
    - Backup list rendering
    - Restore confirmation
    - Progress indication

11. ❌ **DatePicker.tsx**
    - Date selection
    - Keyboard navigation
    - Invalid date handling
    - Min/max date constraints

12. ❌ **MonthSelector.tsx**
    - Month selection
    - Multi-select mode
    - Select all/clear
    - Keyboard shortcuts

13. ❌ **ThemeCustomizer.tsx**
    - Color picker integration
    - Preview
    - Save/reset
    - Preset themes

14. ❌ **YearlyProfitLoss.tsx**
    - Data aggregation
    - Chart rendering
    - Year selection
    - Loading states

15. ❌ **Skeleton.tsx**
    - Rendering different variants
    - Animation behavior
    - Accessibility attributes

---

### 2.2 PARTIALLY TESTED Components (3 total)

#### Dashboard.test.tsx
**Status:** Skeleton only (0% implemented)

**Missing Critical Tests:**
- Starting balance update flow
- Add transaction button click
- Card click navigation
- Error state rendering
- Loading skeleton display
- Responsive layout changes

#### MonthlyAnalysis.test.tsx
**Status:** Skeleton only (0% implemented)

**Missing Critical Tests:**
- Chart data calculation accuracy
- Empty state (no transactions)
- Savings rate calculation
- Daily comparison chart rendering
- Category breakdown rendering
- Insights generation logic

#### CumulativeProfitSelector.test.tsx
**Status:** Skeleton only (0% implemented)

**Missing Critical Tests:**
- Month selection logic
- Cumulative calculation accuracy
- Chart rendering with selected months
- Performance with 12+ months selected
- Edge case: selecting all months then clearing

---

## 3. Integration Test Gaps

### 3.1 auth-flow.test.ts
**Status:** 30 TODO tests, 0% implemented

**Critical Missing Flows:**
1. **Password Reset Flow** — NOT EVEN DEFINED
   - Request reset email
   - Click reset link
   - Set new password
   - Sign in with new password

2. **Profile Completion Flow**
   - OAuth sign in (no name provided)
   - User adds name via settings
   - Name displayed in dashboard

3. **Multi-Device Flow**
   - Sign in on device A
   - Sign in on device B
   - Sign out on device A
   - Device B session handling

4. **Biometric + OAuth Integration**
   - Sign in with Google
   - Enable biometrics
   - Sign out
   - Sign in with biometrics
   - Verify Google account linked

### 3.2 backup-flow.test.ts
**Status:** 25 TODO tests, 0% implemented

**Critical Missing Flows:**
1. **Data Retention Change Flow**
   - User has 12 months data
   - Changes retention to 6 months
   - Auto backup created
   - Old data deleted
   - User can restore from backup

2. **Backup Restoration Flow**
   - User deletes transaction accidentally
   - Opens backup modal
   - Selects recent backup
   - Confirms restore
   - Transaction restored

3. **Backup During Active Use**
   - Auto backup scheduled
   - User is actively creating transactions
   - Backup should not interfere
   - New transactions not included in backup

### 3.3 MISSING Integration Tests

❌ **No integration tests for:**
- Transaction creation → Dashboard update flow
- Settings change → UI update flow
- Advanced search → Transaction list flow
- Internal transfer → Account balance flow
- Theme customization → All components update flow

---

## 4. E2E Test Gaps

### Status: ❌ NO E2E TESTS EXIST

**Critical User Journeys Untested:**
1. **New User Onboarding**
   - Sign up → Add first transaction → View dashboard → Sign out

2. **Daily Usage**
   - Sign in → View dashboard → Add expense → View analysis → Sign out

3. **Monthly Review**
   - Sign in → Select previous month → View analysis → Compare to budget → Create backup

4. **Settings Management**
   - Change language → Change currency → Change theme → Verify all UI updates

5. **Data Management**
   - Create 100 transactions → Change retention to 3 months → Verify old data deleted → Restore from backup

---

## 5. Error Handling Test Gaps

### 5.1 Network Errors
❌ **No tests for:**
- Offline mode behavior
- Slow network (timeout scenarios)
- Intermittent connectivity
- Server 500 errors
- Rate limiting (429 errors)

### 5.2 Data Validation Errors
❌ **No tests for:**
- Invalid form submissions
- Type mismatches from API
- Schema version mismatches
- Corrupted local storage

### 5.3 UI Error States
❌ **No tests for:**
- Error boundaries catching component crashes
- Toast notifications on errors
- Retry button functionality
- Error logging/reporting

---

## 6. Accessibility Test Gaps

### Status: ❌ 0% COVERAGE

**Missing Tests:**
1. **Keyboard Navigation**
   - Tab order through forms
   - Enter/Space to submit
   - Escape to close modals
   - Arrow keys in lists

2. **Screen Reader**
   - ARIA labels on all interactive elements
   - Form field labels
   - Error message announcements
   - Loading state announcements

3. **Visual**
   - Color contrast ratios (WCAG AA)
   - Focus indicators
   - Text scaling (200%)
   - Dark mode accessibility

4. **Semantic HTML**
   - Proper heading hierarchy
   - Form field associations
   - Button vs link usage
   - Landmark regions

---

## 7. Performance Test Gaps

### Status: ❌ 0% COVERAGE

**Missing Tests:**
1. **Rendering Performance**
   - Dashboard with 1000+ transactions
   - MonthlyAnalysis chart rendering time
   - TransactionList virtual scrolling
   - Skeleton loader transition

2. **Memory Leaks**
   - Component unmount cleanup
   - Event listener cleanup
   - AbortController cleanup
   - Supabase subscription cleanup

3. **Bundle Size**
   - No tests for code splitting effectiveness
   - No tests for lazy loading
   - No monitoring of bundle growth

---

## 8. Security Test Gaps

### Status: ❌ 0% COVERAGE

**Missing Tests:**
1. **XSS Prevention**
   - Transaction description with `<script>` tag
   - User name with HTML injection
   - Search query with JS execution attempt

2. **SQL Injection**
   - User input not sanitized
   - No tests for parameterized queries

3. **CSRF Protection**
   - No tests for auth token validation
   - No tests for request origin checking

4. **Data Exposure**
   - No tests for PII in error logs
   - No tests for sensitive data in browser DevTools
   - No tests for API key exposure in client code

---

## Priority Recommendations

### Phase 1: Critical (Week 1)
1. ✅ Implement all **library module tests** (backup, biometrics, i18n, supabase, updateProfile)
2. ✅ Implement **AuthForm component tests**
3. ✅ Implement **auth-flow integration tests**
4. ✅ Add **error boundary tests**

### Phase 2: High Priority (Week 2)
1. ✅ Implement **TransactionForm, TransactionList, Dashboard tests**
2. ✅ Implement **backup-flow integration tests**
3. ✅ Add **accessibility tests** for auth and transaction flows
4. ✅ Add **network error handling tests**

### Phase 3: Medium Priority (Week 3)
1. ✅ Implement remaining component tests
2. ✅ Add **E2E tests** for critical user journeys
3. ✅ Add **performance tests**
4. ✅ Add **security tests**

### Phase 4: Polish (Week 4)
1. ✅ Achieve 80%+ code coverage
2. ✅ Add visual regression tests
3. ✅ Set up CI/CD with test gates
4. ✅ Add mutation testing

---

## Next Steps

Run: `npm test -- --coverage` to establish baseline
Then systematically implement tests following Phase 1-4 priority order.

---

## NEW TEST SKELETONS ADDED (2026-03-29 8:29 PM)

### Critical Additions

1. **TransactionList Performance Tests** ✅
   - Added critical O(n²) bug tests to `src/components/__tests__/TransactionList.test.tsx`
   - Tests specifically target nested loop in running balance calculation (lines 46-57)
   - Includes performance benchmarks and memoization tests

2. **Error Boundary Tests** ✅ NEW FILE
   - Created `src/components/__tests__/ErrorBoundary.test.tsx`
   - Component doesn't exist yet - needs creation
   - Tests cover error catching, reporting, recovery, and specific error types

3. **Accessibility Tests** ✅ NEW FILE
   - Created `src/__tests__/accessibility/a11y.test.tsx`
   - Comprehensive WCAG 2.1 Level AA testing
   - Covers keyboard nav, screen readers, visual accessibility, semantic HTML
   - Includes jest-axe automated tests

4. **E2E User Journey Tests** ✅ NEW FILE
   - Created `src/__tests__/e2e/user-journeys.test.ts`
   - 8 complete user journeys from signup to data recovery
   - Tests real-world workflows, error recovery, performance under load

5. **Supabase Auth Listener Tests** ✅ NEW FILE
   - Created `src/lib/__tests__/supabase-auth-listeners.test.ts`
   - Tests 50+ untested lines of auth state change handling
   - Covers SIGNED_OUT, USER_DELETED, TOKEN_REFRESHED, SIGNED_IN events
   - Tests multi-tab synchronization and memory leaks

### Setup Requirements

Before implementing tests, install dependencies:

```bash
# Accessibility testing
npm install --save-dev jest-axe @axe-core/react

# E2E testing
npm install --save-dev @playwright/test
npx playwright install
```

### Priority Implementation Order

1. **Week 1:** TransactionList O(n²) bug tests + fix the actual bug
2. **Week 2:** Supabase auth listener tests (critical for auth reliability)
3. **Week 3:** Accessibility tests (start with keyboard nav)
4. **Week 4:** E2E user journeys (after unit tests pass)
5. **Week 5:** Error boundary implementation + tests

### Known Gaps Still Remaining

- Components without any tests: 15 remaining (see section 2.1)
- Integration test TODOs: ~55 tests still unimplemented
- Security tests: XSS, CSRF, injection testing
- Visual regression tests
- Mutation testing
- Load/stress testing
