# Task: Performance Fixes + Optimistic Loaders + Enhanced Glassmorphism
Date: 2026-03-29

## Goal
Fix all identified performance issues, add beautiful skeleton/optimistic loading throughout, enhance glassmorphism theme to premium glass-card look, then deploy.

## Plan

### Phase 1: Performance Fixes
- [ ] 1.1 Fix i18n.ts — memoize formatCurrency and t() to stop recreating on every render
- [ ] 1.2 Fix App.tsx — prevent cascading re-renders from auth state changes (useMemo/useCallback)
- [ ] 1.3 Fix Dashboard.tsx — memoize expensive calculations (totalIncome, totalExpenses, balance)
- [ ] 1.4 Fix Dashboard.tsx — batch the 3 parallel fetches into one effect with Promise.all
- [ ] 1.5 Fix supabase.ts — add simple query cache for frequently accessed data
- [ ] 1.6 Fix backup.ts — batch operations instead of N+1 patterns
- [ ] 1.7 Fix CumulativeProfitSelector.tsx — cleanup async operations, abort controllers
- [ ] 1.8 Fix subscription/interval cleanup across components

### Phase 2: Skeleton Loaders & Optimistic UI
- [ ] 2.1 Create reusable Skeleton component (pulse/shimmer animations)
- [ ] 2.2 Add skeleton loaders to Dashboard (stat cards, transaction list, balance)
- [ ] 2.3 Add skeleton loaders to MonthlyAnalysis (charts, tables)
- [ ] 2.4 Add skeleton loaders to YearlyProfitLoss
- [ ] 2.5 Add skeleton loaders to CumulativeProfitSelector
- [ ] 2.6 Add skeleton to BackupRestoreModal
- [ ] 2.7 Add optimistic updates for transaction add/delete (instant UI update, rollback on error)
- [ ] 2.8 Add smooth transitions between loading and content states

### Phase 3: Enhanced Glassmorphism Theme
- [ ] 3.1 Upgrade index.css — stronger glass effects, better blur, refined borders/shadows
- [ ] 3.2 Update card components — frosted glass frames with layered depth
- [ ] 3.3 Update modals — premium glass overlay with depth
- [ ] 3.4 Update stat cards — glass morphism with subtle inner glow
- [ ] 3.5 Update navigation — glass pill with enhanced blur
- [ ] 3.6 Update inputs/buttons — glass-styled form elements
- [ ] 3.7 Ensure light mode also gets beautiful glass treatment

### Phase 4: Deploy
- [ ] 4.1 Build and verify zero errors
- [ ] 4.2 Git init (if needed), commit all changes
- [ ] 4.3 Push to https://github.com/IdanBadin/monthlyBudgetTracker
- [ ] 4.4 Trigger Netlify deploy for project 9d6289a4-585a-41e8-bd32-4aa8f7218408

## Notes
- Preserve all RTL/Hebrew support
- Don't break existing functionality
- Keep bundle size reasonable
- Glass effects need to work on both light and dark modes
