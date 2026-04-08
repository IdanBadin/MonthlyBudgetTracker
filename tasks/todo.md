# Monthly Budget Tracker — TODO

## Completed
- [x] Full "Midnight Finance" glassmorphism redesign
- [x] Phase 1 performance fixes (i18n, useCallback, memoization, Promise.all, abort controllers)
- [x] Skeleton loader components
- [x] Deep performance analysis (PERFORMANCE_ANALYSIS.md)
- [x] Test skeleton files created
- [x] CumulativeProfitSelector N+1 query fix
- [x] MonthlyAnalysis useMemo for all calculations + chart data
- [x] Dashboard auth consolidation (3 calls → 1)
- [x] App.tsx backup interval stability (useRef)
- [x] Supabase retry AbortSignal support
- [x] TransactionList O(n²) → O(n) running balance fix
- [x] Push to GitHub + deploy to Netlify
- [x] הסרת border לבן מהתפריט התחתון
- [x] עדכון README.md עם תיאור האפליקציה
- [x] חיבור Netlify CI/CD לגיטהאב (auto-deploy on push)
- [x] הגדרת env vars ב-Netlify (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [x] אימות RLS על כל 10 הטבלאות ב-Supabase ✅

## Open
- [ ] **Phase 1 (Critical):**
  - [ ] Fix #1: Auth listener memory leak in supabase.ts:116
  - [ ] Fix #2: AdvancedSearch debouncing
- [ ] **Phase 2 (High Impact):**
  - [ ] Fix #3: AdvancedSearch auth caching
  - [ ] Fix #4: AdvancedSearch memoization
- [ ] **Phase 3 (Polish):**
  - [ ] Fix #5: App.tsx theme dependency array
  - [ ] Fix #6: Backup profile caching
- [ ] Complete test implementations (skeleton files exist)
- [ ] Visual QA pass in browser
- [ ] Security review (.env handling)
- [ ] Consider React Query for server-state caching (deferred)
