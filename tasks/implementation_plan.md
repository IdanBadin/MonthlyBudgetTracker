# Performance Fixes Implementation Plan

**Date:** 2026-03-29
**Status:** Ready to implement — 6 fixes remaining

---

## Phase 1: CRITICAL (~20 min)

### Fix #1: Auth Listener Memory Leak (5 min)
**File:** `src/lib/supabase.ts:116-133`
**Changes:**
1. Add module-level variable: `let authSubscription: { unsubscribe: () => void } | null = null;`
2. Store subscription: `authSubscription = data.subscription;`
3. Add cleanup check before creating new listener
4. Export cleanup function for testing

**Reference:** PERFORMANCE_FIXES.md lines 30-66

---

### Fix #2: AdvancedSearch Debouncing (15 min)
**File:** `src/components/AdvancedSearch.tsx:81-98`
**Changes:**
1. Add state: `const [debouncedFilters, setDebouncedFilters] = useState<SearchFilters>(DEFAULT_FILTERS);`
2. Add ref: `const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);`
3. Add debounce effect (300ms delay)
4. Update handlers to only set local state
5. Trigger `onSearch` only when debounced filters change

**Reference:** PERFORMANCE_FIXES.md lines 91-144

---

## Phase 2: HIGH IMPACT (~20 min)

### Fix #3: AdvancedSearch Auth Caching (10 min)
**File:** `src/components/AdvancedSearch.tsx:60-79, 108, 137`
**Changes:**
1. Add ref: `const userIdRef = useRef<string | null>(null);`
2. Get userId once on mount in `useEffect`
3. Update `loadSavedFilters` to accept `userId` parameter
4. Update `handleSaveFilter` to use cached `userIdRef.current`
5. Update `handleDeleteFilter` to use cached userId

**Reference:** PERFORMANCE_FIXES.md lines 180-253

---

### Fix #4: AdvancedSearch Memoization (10 min)
**File:** `src/components/AdvancedSearch.tsx`
**Changes:**
1. Import `memo` from React
2. Wrap component with `React.memo()`
3. Add `useMemo` for `minDateStr` and `hasActiveFilters`
4. Ensure parent passes stable `onSearch` callback with `useCallback`

**Reference:** PERFORMANCE_FIXES.md lines 277-336

---

## Phase 3: POLISH (~20 min)

### Fix #5: App.tsx Theme Deps (5 min)
**File:** `src/App.tsx:76-81`
**Changes:**
1. Extract primitive values: `const primaryColor = profile?.theme_colors?.primary;`
2. Update dependency array to: `[primaryColor, secondaryColor]`

**Reference:** PERFORMANCE_FIXES.md lines 361-387

---

### Fix #6: Backup Profile Caching (15 min)
**File:** `src/lib/backup.ts:23-29` + `src/App.tsx:64`
**Changes:**
**Option 1 (Recommended):** Pass retention as parameter
1. Update `createBackup` signature: `createBackup(userId: string, retentionMonths: number = 6, backupType: 'auto' | 'manual' = 'auto')`
2. Remove profile fetch from `createBackup`
3. Update `scheduleBackup` signature similarly
4. Update calls in `App.tsx:64, 67` to pass `profile.data_retention_months || 6`

**Option 2:** Add simple caching layer with 5-minute TTL

**Reference:** PERFORMANCE_FIXES.md lines 413-490

---

## Testing Checklist

After each fix:
- [ ] **Fix #1:** Open DevTools → Performance → Memory → Sign in/out 10x → Verify memory stable
- [ ] **Fix #2:** Type "groceries" → Network tab → Verify ≤2 calls (not 9)
- [ ] **Fix #3:** Network tab → Load filters → Verify getUser() called once
- [ ] **Fix #4:** React DevTools Profiler → Type in search → Verify reduced re-renders
- [ ] **Fix #5:** Change profile name → Verify theme CSS vars NOT updated
- [ ] **Fix #6:** Create 3 backups → Network tab → Verify profile fetched ≤1 time

---

## Estimated Impact Summary

| Fix | Severity | Time | Impact |
|-----|----------|------|--------|
| #1 Auth Leak | 🔴 CRITICAL | 5m | Prevents memory leak (1-5MB/hr) |
| #2 Debouncing | 🔴 CRITICAL | 15m | 90% reduction in re-renders |
| #3 Auth Cache | 🟡 MEDIUM | 10m | 66% reduction in auth calls |
| #4 Memoization | 🟡 MEDIUM | 10m | 80% reduction in re-renders |
| #5 Theme Deps | 🟡 LOW | 5m | Eliminates unnecessary DOM updates |
| #6 Backup Cache | 🟡 LOW | 15m | 4 fewer queries/day |

**Total Time:** ~60 minutes
**Total Impact:** Significant performance improvement across critical user flows

---

## Next Steps

1. Implement Phase 1 (Critical) immediately
2. Test each fix individually
3. Commit after each phase with descriptive messages
4. Run full performance testing checklist
5. Deploy to Netlify after all fixes verified
