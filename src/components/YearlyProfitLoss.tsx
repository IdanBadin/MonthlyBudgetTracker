import React, { useState, useEffect } from 'react';
import { format, startOfYear, endOfYear, eachMonthOfInterval, isSameMonth, subMonths } from 'date-fns';
import { TrendingUp, TrendingDown, Calendar, BarChart3, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Profile, Transaction } from '../types/database';
import { useTranslation } from '../lib/i18n';
import { MonthlyBreakdownSkeleton } from './Skeleton';

type YearlyProfitLossProps = {
  profile?: Profile | null;
  selectedYear: number;
  onYearChange: (year: number) => void;
};

type MonthlyData = {
  month: Date;
  monthlyProfit: number;
  cumulativeProfit: number;
  income: number;
  expenses: number;
};

export function YearlyProfitLoss({ profile, selectedYear, onYearChange }: YearlyProfitLossProps) {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalances, setShowBalances] = useState(() => profile?.dashboard_settings?.showBalance ?? true);
  const { t, formatCurrency, isRTL } = useTranslation(profile);

  const minAllowedDate = React.useMemo(() => {
    const retentionMonths = profile?.data_retention_months || 6;
    return subMonths(new Date(), retentionMonths);
  }, [profile?.data_retention_months]);

  const availableYears = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const minYear = minAllowedDate.getFullYear();
    const years = [];
    for (let year = currentYear; year >= minYear; year--) {
      years.push(year);
    }
    return years;
  }, [minAllowedDate]);

  useEffect(() => {
    if (profile?.dashboard_settings?.showBalance !== undefined) {
      setShowBalances(profile.dashboard_settings.showBalance);
    }
  }, [profile?.dashboard_settings?.showBalance]);

  useEffect(() => {
    fetchYearlyData();
  }, [selectedYear, minAllowedDate]);

  const fetchYearlyData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const yearStart = startOfYear(new Date(selectedYear, 0, 1));
      const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
      const minAllowedDateStr = format(minAllowedDate, 'yyyy-MM-dd');

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', format(yearStart, 'yyyy-MM-dd'))
        .lte('date', format(yearEnd, 'yyyy-MM-dd'))
        .gte('date', minAllowedDateStr)
        .order('date', { ascending: true });

      if (error) throw error;

      const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
      const validMonths = months.filter(month => month >= new Date(minAllowedDate.getFullYear(), minAllowedDate.getMonth(), 1));

      let cumulativeProfit = 0;
      const monthlyDataArray: MonthlyData[] = validMonths.map(month => {
        const monthTransactions = (transactions || []).filter(t =>
          isSameMonth(new Date(t.date), month)
        );

        const income = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const expenses = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const monthlyProfit = income - expenses;
        cumulativeProfit += monthlyProfit;

        return {
          month,
          monthlyProfit,
          cumulativeProfit,
          income,
          expenses
        };
      });

      setMonthlyData(monthlyDataArray);
    } catch (error) {
      console.error('Error fetching yearly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBalanceVisibility = async () => {
    try {
      const newShowBalance = !showBalances;
      setShowBalances(newShowBalance);

      const { error } = await supabase
        .from('profiles')
        .update({
          dashboard_settings: {
            ...profile?.dashboard_settings,
            showBalance: newShowBalance
          }
        })
        .eq('id', profile?.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating balance visibility:', error);
      setShowBalances(!showBalances);
    }
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

  const finalCumulativeProfit = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].cumulativeProfit : 0;
  const isYearlyProfit = finalCumulativeProfit >= 0;

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-3 w-24 skeleton-shimmer bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
              <div className="h-7 w-32 skeleton-shimmer bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
            </div>
            <div className="h-9 w-9 skeleton-shimmer bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
          </div>
        </div>
        <MonthlyBreakdownSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
              {t('analysis.yearly_profit_loss')}
            </h3>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            className="modern-input text-xs py-1 px-2 w-auto"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <button
          onClick={toggleBalanceVisibility}
          className="p-1.5 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-white/5 rounded-lg transition-all duration-200"
        >
          {showBalances ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className={`glass-card p-4 border-l-[3px] transition-all duration-200 ${
        isYearlyProfit ? 'border-l-emerald-500' : 'border-l-rose-500'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-medium text-slate-500 dark:text-zinc-400 mb-0.5">
              {isYearlyProfit ? t('analysis.yearly_profit') : t('analysis.yearly_loss')} {selectedYear}
            </h4>
            <p className={`text-xl font-bold ${
              isYearlyProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatBalanceDisplay(Math.abs(finalCumulativeProfit))}
            </p>
          </div>
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
            isYearlyProfit ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-rose-100 dark:bg-rose-900/40'
          }`}>
            {isYearlyProfit ? (
              <TrendingUp className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <TrendingDown className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />
            )}
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/8">
          <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            {t('analysis.monthly_breakdown')}
          </h4>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
          {monthlyData.map((data, index) => {
            const isMonthlyProfit = data.monthlyProfit >= 0;
            const isCumulativeProfit = data.cumulativeProfit >= 0;

            return (
              <div key={index} className="px-4 py-3 hover:bg-indigo-50/30 dark:hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-indigo-400 dark:text-indigo-500" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {formatMonth(data.month)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">
                        {t('analysis.monthly')}
                      </div>
                      <div className={`text-xs font-medium ${
                        isMonthlyProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`} dir="ltr">
                        {isMonthlyProfit ? '+' : '-'}{formatBalanceDisplay(Math.abs(data.monthlyProfit))}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">
                        {t('analysis.cumulative')}
                      </div>
                      <div className={`text-sm font-bold ${
                        isCumulativeProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`} dir="ltr">
                        {isCumulativeProfit ? '+' : '-'}{formatBalanceDisplay(Math.abs(data.cumulativeProfit))}
                      </div>
                    </div>

                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isCumulativeProfit ? 'bg-emerald-500' : 'bg-rose-500'
                    }`} />
                  </div>
                </div>

                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-400 dark:text-zinc-500">
                  <span>
                    {t('dashboard.total_income')}: {formatBalanceDisplay(data.income)}
                  </span>
                  <span>|</span>
                  <span>
                    {t('dashboard.total_expenses')}: {formatBalanceDisplay(data.expenses)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {monthlyData.length === 0 && (
          <div className="p-8 text-center">
            <Calendar className="h-10 w-10 mx-auto text-slate-300 dark:text-zinc-600 mb-2" />
            <p className="text-sm text-slate-500 dark:text-zinc-500">
              {t('analysis.no_data_for_year')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
