import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, isSameMonth, subMonths, isBefore } from 'date-fns';
import { TrendingUp, TrendingDown, Calendar, CheckCircle2, Circle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';
import { useTranslation } from '../lib/i18n';
import { MonthlyBreakdownSkeleton } from './Skeleton';

type CumulativeProfitSelectorProps = {
  profile?: Profile | null;
};

type MonthData = {
  date: Date;
  profit: number;
  income: number;
  expenses: number;
};

export function CumulativeProfitSelector({ profile }: CumulativeProfitSelectorProps) {
  const [availableMonths, setAvailableMonths] = useState<Date[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<Date[]>([]);
  const [monthsData, setMonthsData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingData, setFetchingData] = useState(false);
  const { t, formatCurrency } = useTranslation(profile);
  const showBalances = profile?.dashboard_settings?.showBalance ?? true;
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const minAllowedDate = React.useMemo(() => {
    const retentionMonths = profile?.data_retention_months || 6;
    return subMonths(new Date(), retentionMonths);
  }, [profile?.data_retention_months]);

  useEffect(() => {
    generateAvailableMonths();
  }, [minAllowedDate]);

  useEffect(() => {
    if (selectedMonths.length > 0) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      fetchMonthsData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedMonths]);

  const generateAvailableMonths = () => {
    const months: Date[] = [];
    const now = new Date();
    let currentMonth = startOfMonth(now);
    const minMonth = startOfMonth(minAllowedDate);

    while (!isBefore(currentMonth, minMonth)) {
      months.push(currentMonth);
      currentMonth = subMonths(currentMonth, 1);
    }

    setAvailableMonths(months);
    setSelectedMonths([startOfMonth(now)]);
    setLoading(false);
  };

  const fetchMonthsData = async () => {
    abortControllerRef.current = new AbortController();
    const currentController = abortControllerRef.current;

    try {
      setFetchingData(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (currentController.signal.aborted) return;

      // Sort selected months to get date range
      const sortedMonths = [...selectedMonths].sort((a, b) => a.getTime() - b.getTime());
      const rangeStart = startOfMonth(sortedMonths[0]);
      const rangeEnd = endOfMonth(sortedMonths[sortedMonths.length - 1]);

      // SINGLE query for ALL months
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', format(rangeStart, 'yyyy-MM-dd'))
        .lte('date', format(rangeEnd, 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (error) throw error;
      if (currentController.signal.aborted) return;

      // Group transactions by month in memory (fast)
      const data = selectedMonths.map((month) => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);

        const monthTransactions = (transactions || []).filter(t => {
          const tDate = new Date(t.date);
          return tDate >= monthStart && tDate <= monthEnd;
        });

        const income = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const expenses = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        return {
          date: month,
          profit: income - expenses,
          income,
          expenses
        };
      });

      if (currentController.signal.aborted) return;

      data.sort((a, b) => a.date.getTime() - b.date.getTime());
      setMonthsData(data);
    } catch (error) {
      if (!currentController.signal.aborted) {
        console.error('Error fetching months data:', error);
      }
    } finally {
      if (!currentController.signal.aborted) {
        setFetchingData(false);
      }
    }
  };

  const toggleMonth = (month: Date) => {
    if (fetchingData) return;

    const isSelected = selectedMonths.some(m => isSameMonth(m, month));

    if (isSelected) {
      if (selectedMonths.length > 1) {
        setSelectedMonths(selectedMonths.filter(m => !isSameMonth(m, month)));
      }
    } else {
      setSelectedMonths([...selectedMonths, month].sort((a, b) => a.getTime() - b.getTime()));
    }
  };

  const selectAllMonths = () => {
    setSelectedMonths([...availableMonths]);
  };

  const clearSelection = () => {
    setSelectedMonths([startOfMonth(new Date())]);
  };

  const formatBalanceDisplay = (amount: number) => {
    return showBalances ? formatCurrency(amount) : '------';
  };

  const formatMonth = (date: Date) => {
    const monthNumber = parseInt(format(date, 'M'));
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    return t(`months.${months[monthNumber - 1]}`);
  };

  const cumulativeProfit = monthsData.reduce((sum, data) => sum + data.profit, 0);
  const cumulativeIncome = monthsData.reduce((sum, data) => sum + data.income, 0);
  const cumulativeExpenses = monthsData.reduce((sum, data) => sum + data.expenses, 0);
  const isProfit = cumulativeProfit >= 0;

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-3 w-28 skeleton-shimmer bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
              <div className="h-7 w-32 skeleton-shimmer bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
            </div>
            <div className="h-9 w-9 skeleton-shimmer bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
          </div>
        </div>
        <div className="glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-white/8">
            <div className="h-3 w-24 skeleton-shimmer bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-2.5 rounded-xl border-2 border-slate-200/50 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 skeleton-shimmer bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
                  <div className="h-3.5 w-3.5 skeleton-shimmer bg-slate-200/60 dark:bg-white/[0.06] rounded-full" />
                </div>
                <div className="h-3 w-14 skeleton-shimmer bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-[#29695b] dark:text-[#94d3c1]" />
          <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
            {t('analysis.cumulative_profit')}
          </h3>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={selectAllMonths}
            className="text-[11px] px-2 py-1 bg-[#f2f4f5] dark:bg-[#94d3c1]/10 text-[#00342b] dark:text-[#94d3c1] rounded-lg hover:bg-[#eceeef] dark:hover:bg-[#94d3c1]/20 transition-all duration-200"
          >
            {t('common.select_all')}
          </button>
          <button
            onClick={clearSelection}
            className="text-[11px] px-2 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all duration-200"
          >
            {t('common.clear')}
          </button>
        </div>
      </div>

      <div className={`glass-card p-4 border-l-[3px] transition-all duration-200 ${
        isProfit ? 'border-l-emerald-500' : 'border-l-rose-500'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-medium text-slate-500 dark:text-zinc-400 mb-0.5">
              {isProfit ? t('analysis.cumulative_profit') : t('analysis.cumulative_loss')}
            </h4>
            <p className={`text-xl font-bold truncate ${
              isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatBalanceDisplay(Math.abs(cumulativeProfit))}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
              {selectedMonths.length} {selectedMonths.length === 1 ? t('common.month_single') : t('common.months_plural')}
            </p>
          </div>
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isProfit ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-rose-100 dark:bg-rose-900/40'
          }`}>
            {isProfit ? (
              <TrendingUp className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <TrendingDown className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-white/8">
          <div className="min-w-0">
            <div className="text-[11px] text-slate-400 dark:text-zinc-500 mb-0.5">
              {t('dashboard.total_income')}
            </div>
            <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 truncate">
              {formatBalanceDisplay(cumulativeIncome)}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-slate-400 dark:text-zinc-500 mb-0.5">
              {t('dashboard.total_expenses')}
            </div>
            <div className="text-sm font-semibold text-rose-600 dark:text-rose-400 truncate">
              {formatBalanceDisplay(cumulativeExpenses)}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/8">
          <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            {t('common.select_months')}
          </h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
          {availableMonths.map((month, index) => {
            const isSelected = selectedMonths.some(m => isSameMonth(m, month));
            const monthData = monthsData.find(d => isSameMonth(d.date, month));
            const monthProfit = monthData?.profit || 0;
            const isProfitable = monthProfit >= 0;

            return (
              <button
                key={index}
                onClick={() => toggleMonth(month)}
                disabled={fetchingData}
                className={`p-2.5 rounded-xl border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-[#29695b] dark:border-[#94d3c1] bg-[#f2f4f5]/50 dark:bg-[#94d3c1]/10'
                    : 'border-slate-200 dark:border-white/8 hover:border-[#94d3c1] dark:hover:border-[#94d3c1]/40'
                } ${fetchingData ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium truncate flex-1 ${
                    isSelected ? 'text-[#00342b] dark:text-[#94d3c1]' : 'text-slate-700 dark:text-zinc-300'
                  }`}>
                    {formatMonth(month)}
                  </span>
                  {isSelected ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#29695b] dark:text-[#94d3c1] flex-shrink-0 ml-1" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-slate-300 dark:text-zinc-600 flex-shrink-0 ml-1" />
                  )}
                </div>
                <div className={`text-[11px] font-medium truncate ${
                  isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {monthData ? formatBalanceDisplay(Math.abs(monthProfit)) : '-'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {monthsData.length > 1 && (
        <div className="glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-white/8">
            <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              {t('analysis.monthly_breakdown')}
            </h4>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {monthsData.map((data, index) => {
              const isMonthProfit = data.profit >= 0;

              return (
                <div key={index} className="px-4 py-3 hover:bg-[#f2f4f5]/30 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Calendar className="h-3.5 w-3.5 text-[#29695b]/60 dark:text-[#94d3c1]/60 flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {formatMonth(data.date)} {format(data.date, 'yyyy')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={`text-sm font-bold ${
                        isMonthProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`} dir="ltr">
                        {isMonthProfit ? '+' : '-'}{formatBalanceDisplay(Math.abs(data.profit))}
                      </div>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isMonthProfit ? 'bg-emerald-500' : 'bg-rose-500'
                      }`} />
                    </div>
                  </div>

                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-400 dark:text-zinc-500">
                    <span className="truncate">
                      {t('dashboard.total_income')}: {formatBalanceDisplay(data.income)}
                    </span>
                    <span>|</span>
                    <span className="truncate">
                      {t('dashboard.total_expenses')}: {formatBalanceDisplay(data.expenses)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
