import React from 'react';

type SkeletonProps = {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
};

export function Skeleton({ className = '', rounded = 'lg' }: SkeletonProps) {
  return (
    <div
      className={`skeleton-shimmer bg-slate-200/60 dark:bg-white/[0.06] rounded-${rounded} ${className}`}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-7" rounded="lg" />
      </div>
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-2.5 w-16" />
    </div>
  );
}

export function TransactionSkeleton() {
  return (
    <div className="px-4 py-3.5 flex items-start gap-3">
      <Skeleton className="w-1 h-11" rounded="full" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-4 w-16" rounded="md" />
        </div>
      </div>
    </div>
  );
}

export function TransactionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="divide-y divide-slate-100/80 dark:divide-white/5">
        {Array.from({ length: count }).map((_, i) => (
          <TransactionSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  const heights = ['60%', '80%', '45%', '90%', '55%', '70%', '40%', '75%'];
  const heights2 = ['40%', '55%', '70%', '35%', '65%', '50%', '85%', '45%'];
  return (
    <div className="glass-card p-4 space-y-4">
      <Skeleton className="h-5 w-40" />
      <div className="h-[250px] sm:h-[350px] flex items-end gap-2 px-4 pb-4">
        {heights.map((h, i) => (
          <div key={i} className="flex-1 flex gap-1 items-end h-full">
            <div className="flex-1 skeleton-shimmer bg-emerald-200/40 dark:bg-emerald-500/10 rounded-t-md" style={{ height: h }} />
            <div className="flex-1 skeleton-shimmer bg-rose-200/40 dark:bg-rose-500/10 rounded-t-md" style={{ height: heights2[i] }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalysisCardSkeleton() {
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-9" rounded="xl" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function MonthlyBreakdownSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-white/8">
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-3.5" rounded="sm" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-2 w-2" rounded="full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BackupListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4" rounded="sm" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1"><StatCardSkeleton /></div>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <div className="col-span-2 sm:col-span-1"><StatCardSkeleton /></div>
      </div>
      <div className="glass-card p-4 space-y-4">
        <Skeleton className="h-10 w-full" rounded="xl" />
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-2.5 w-16" />
          </div>
          <Skeleton className="h-10 w-10" rounded="xl" />
        </div>
      </div>
      <TransactionListSkeleton count={4} />
    </div>
  );
}
