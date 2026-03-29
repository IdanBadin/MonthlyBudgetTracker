import React, { useState, useEffect, useMemo } from 'react';
import { format, getDaysInMonth, subMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ArrowUp, ArrowLeft, TrendingUp, TrendingDown, DollarSign, Calendar, Wallet, LayoutDashboard, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Profile, Transaction } from '../types/database';
import { useTranslation } from '../lib/i18n';
import { AnalysisCardSkeleton, ChartSkeleton } from './Skeleton';

type MonthlyAnalysisProps = {
  profile?: Profile | null;
};

const COLORS = ['#10B981', '#F43F5E', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'];

export function MonthlyAnalysis({ profile }: MonthlyAnalysisProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [previousMonthTransactions, setPreviousMonthTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, formatCurrency, isRTL } = useTranslation(profile);
  const showBalances = profile?.dashboard_settings?.showBalance ?? true;

  // Calculate minimum allowed date based on data retention setting
  const minAllowedDate = React.useMemo(() => {
    const retentionMonths = profile?.data_retention_months || 6;
    return subMonths(new Date(), retentionMonths);
  }, [profile?.data_retention_months]);

  // Ensure selected month is within retention period
  useEffect(() => {
    const firstDayOfMinMonth = new Date(minAllowedDate.getFullYear(), minAllowedDate.getMonth(), 1);
    if (selectedMonth < firstDayOfMinMonth) {
      setSelectedMonth(firstDayOfMinMonth);
    }
  }, [selectedMonth, minAllowedDate]);

  const formatBalanceDisplay = (amount: number) => {
    return showBalances ? formatCurrency(amount) : '• • • • • •';
  };

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Current month
      const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

      // Previous month
      const startOfPrevMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1);
      const endOfPrevMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 0);

      const minAllowedDateStr = format(minAllowedDate, 'yyyy-MM-dd');

      const [currentMonthData, previousMonthData] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', format(startOfMonth, 'yyyy-MM-dd'))
          .lte('date', format(endOfMonth, 'yyyy-MM-dd'))
          .gte('date', minAllowedDateStr) // Only fetch transactions within retention period
          .order('date', { ascending: true }),
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', format(startOfPrevMonth, 'yyyy-MM-dd'))
          .lte('date', format(endOfPrevMonth, 'yyyy-MM-dd'))
          .gte('date', minAllowedDateStr) // Only fetch transactions within retention period
          .order('date', { ascending: true })
      ]);

      if (currentMonthData.error) throw currentMonthData.error;
      if (previousMonthData.error) throw previousMonthData.error;

      setTransactions(currentMonthData.data || []);
      setPreviousMonthTransactions(previousMonthData.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [selectedMonth, minAllowedDate]);

  // Memoized financial calculations
  const {
    totalIncome, totalExpenses, prevTotalIncome, prevTotalExpenses,
    incomeChange, expenseChange, savingsRate, prevSavingsRate, savingsRateChange,
    savingsAmount, prevSavingsAmount, savingsAmountChange,
    daysInMonth, avgDailyExpense, avgDailyIncome,
    avgDailyExpenseChange, avgDailyIncomeChange,
    expenseRatio, daysWithExpenses, expenseFrequency
  } = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const prevTotalIncome = previousMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const prevTotalExpenses = previousMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const incomeChange = prevTotalIncome > 0
      ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100
      : 0;

    const expenseChange = prevTotalExpenses > 0
      ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100
      : 0;

    const savingsRate = totalIncome > 0
      ? ((totalIncome - totalExpenses) / totalIncome) * 100
      : 0;

    const prevSavingsRate = prevTotalIncome > 0
      ? ((prevTotalIncome - prevTotalExpenses) / prevTotalIncome) * 100
      : 0;

    const savingsRateChange = prevSavingsRate !== 0
      ? savingsRate - prevSavingsRate
      : 0;

    const savingsAmount = totalIncome - totalExpenses;
    const prevSavingsAmount = prevTotalIncome - prevTotalExpenses;
    const savingsAmountChange = prevSavingsAmount !== 0
      ? ((savingsAmount - prevSavingsAmount) / prevSavingsAmount) * 100
      : 0;

    const daysInMonth = getDaysInMonth(selectedMonth);
    const avgDailyExpense = totalExpenses / daysInMonth;
    const avgDailyIncome = totalIncome / daysInMonth;

    const prevDaysInMonth = getDaysInMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
    const prevAvgDailyExpense = prevTotalExpenses / prevDaysInMonth;
    const prevAvgDailyIncome = prevTotalIncome / prevDaysInMonth;

    const avgDailyExpenseChange = prevAvgDailyExpense > 0
      ? ((avgDailyExpense - prevAvgDailyExpense) / prevAvgDailyExpense) * 100
      : 0;

    const avgDailyIncomeChange = prevAvgDailyIncome > 0
      ? ((avgDailyIncome - prevAvgDailyIncome) / prevAvgDailyIncome) * 100
      : 0;

    const expenseRatio = totalIncome > 0
      ? (totalExpenses / totalIncome) * 100
      : 0;

    const daysWithExpenses = new Set(
      transactions
        .filter(t => t.type === 'expense')
        .map(t => t.date)
    ).size;
    const expenseFrequency = (daysWithExpenses / daysInMonth) * 100;

    return {
      totalIncome, totalExpenses, prevTotalIncome, prevTotalExpenses,
      incomeChange, expenseChange, savingsRate, prevSavingsRate, savingsRateChange,
      savingsAmount, prevSavingsAmount, savingsAmountChange,
      daysInMonth, avgDailyExpense, avgDailyIncome,
      avgDailyExpenseChange, avgDailyIncomeChange,
      expenseRatio, daysWithExpenses, expenseFrequency
    };
  }, [transactions, previousMonthTransactions, selectedMonth]);

  const dailyFlowData = useMemo(() => transactions.reduce((acc: any[], transaction) => {
    const date = transaction.date;
    const existingDay = acc.find(d => d.date === format(new Date(date), 'dd/MM'));

    if (existingDay) {
      if (transaction.type === 'income') {
        existingDay.income += Number(transaction.amount);
      } else {
        existingDay.expenses += Number(transaction.amount);
      }
    } else {
      acc.push({
        date: format(new Date(date), 'dd/MM'),
        income: transaction.type === 'income' ? Number(transaction.amount) : 0,
        expenses: transaction.type === 'expense' ? Number(transaction.amount) : 0
      });
    }

    return acc;
  }, []), [transactions]);

  const categoryChartData = useMemo(() => {
    const categoryData = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc: { [key: string]: { amount: number, originalCategory: string } }, transaction) => {
        const normalizedCategory = transaction.category.toLowerCase().trim();
        if (!acc[normalizedCategory]) {
          acc[normalizedCategory] = {
            amount: 0,
            originalCategory: transaction.category
          };
        }
        acc[normalizedCategory].amount += Number(transaction.amount);
        return acc;
      }, {});

    return Object.entries(categoryData)
      .map(([_, data]) => ({
        category: data.originalCategory,
        amount: data.amount,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, totalExpenses]);

  const tips = [];

  if (savingsRate < 0) {
    tips.push(t('tips.negative_savings'));
  } else if (savingsRate < 10) {
    tips.push(t('tips.low_savings'));
  }

  if (categoryChartData.length > 0 && categoryChartData[0].percentage > 40) {
    const categoryKey = `categories.${categoryChartData[0].category.toLowerCase().replace(/[\s.]/g, '_')}`;
    const categoryName = t(categoryKey);
    tips.push(t('tips.high_category_spending').replace('{category}', categoryName));
  }

  const highExpenseDays = dailyFlowData.filter(d => d.expenses > (totalExpenses / getDaysInMonth(selectedMonth)) * 2);
  if (highExpenseDays.length > 3) {
    tips.push(t('tips.irregular_spending'));
  }

  const handleMonthChange = (date: Date) => {
    const firstDayOfMinMonth = new Date(minAllowedDate.getFullYear(), minAllowedDate.getMonth(), 1);
    const newMonth = new Date(date.getFullYear(), date.getMonth(), 1);

    // Ensure the selected month is not before the minimum allowed date
    if (newMonth < firstDayOfMinMonth) {
      setSelectedMonth(firstDayOfMinMonth);
    } else {
      setSelectedMonth(newMonth);
    }
  };

  return (
    <div className="min-h-screen pb-20 sm:pb-6">
      <div className="fixed top-0 left-0 right-0 z-30 modern-header">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="sm:hidden text-slate-500 dark:text-zinc-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              >
                <ArrowLeft className={`h-5 w-5 transform ${isRTL ? 'rotate-180' : ''}`} />
              </Link>
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-md shadow-indigo-500/25">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                {t('analysis.title')}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3.5rem + 1.5rem)' }}>
        {loading ? (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnalysisCardSkeleton />
              <AnalysisCardSkeleton />
              <AnalysisCardSkeleton />
            </div>
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        ) : (
          <div className="space-y-6 content-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-2 rounded-xl ${savingsRate >= 0 ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
                    {savingsRate >= 0 ? (
                      <TrendingUp className={`h-5 w-5 ${savingsRate >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    )}
                  </div>
                  <h3 className="text-xs font-semibold text-slate-600 dark:text-zinc-400 tracking-wide uppercase">
                    {t('analysis.savings_rate')}
                  </h3>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-baseline gap-2">
                    <p className={`text-2xl font-bold tracking-tight ${savingsRate >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {isRTL
                        ? `${Math.abs(savingsRate).toFixed(1)}%${savingsRate < 0 ? '-' : ''}`
                        : `${savingsRate < 0 ? '-' : ''}${Math.abs(savingsRate).toFixed(1)}%`
                      }
                    </p>
                    <span className={`text-xs font-medium ${savingsRateChange > 0 ? 'text-emerald-500' : savingsRateChange < 0 ? 'text-rose-500' : 'text-slate-500 dark:text-zinc-500'}`}>
                      {savingsRateChange > 0 ? '↑' : savingsRateChange < 0 ? '↓' : '→'} {Math.abs(savingsRateChange).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-sm font-medium ${savingsAmount >= 0 ? 'text-emerald-600/80 dark:text-emerald-400/80' : 'text-rose-600/80 dark:text-rose-400/80'}`}>
                      {formatBalanceDisplay(savingsAmount)}
                    </p>
                    <span className={`text-xs ${savingsAmountChange > 0 ? 'text-emerald-500/70' : savingsAmountChange < 0 ? 'text-rose-500/70' : 'text-slate-500/70 dark:text-zinc-500/70'}`}>
                      {savingsAmountChange > 0 ? '↑' : savingsAmountChange < 0 ? '↓' : '→'} {Math.abs(savingsAmountChange).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">
                  {savingsRate >= 20 ? t('analysis.excellent_savings') :
                   savingsRate >= 10 ? t('analysis.good_savings') :
                   savingsRate >= 0 ? t('analysis.moderate_savings') :
                   t('analysis.negative_savings')}
                </p>
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-xl bg-emerald-500/15">
                    <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-xs font-semibold text-slate-600 dark:text-zinc-400 tracking-wide uppercase">
                    {t('analysis.income_change')}
                  </h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {formatBalanceDisplay(totalIncome)}
                  </p>
                  <span className={`text-xs font-medium ${incomeChange > 0 ? 'text-emerald-500' : incomeChange < 0 ? 'text-rose-500' : 'text-slate-500 dark:text-zinc-500'}`}>
                    {incomeChange > 0 ? '↑' : incomeChange < 0 ? '↓' : '→'} {Math.abs(incomeChange).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">
                  {t('analysis.vs_last_month')}
                </p>
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-xl bg-indigo-500/15">
                    <Calendar className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-xs font-semibold text-slate-600 dark:text-zinc-400 tracking-wide uppercase">
                    {t('analysis.daily_averages')}
                  </h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-500 dark:text-zinc-500">
                        {t('dashboard.total_income')}
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          {formatBalanceDisplay(avgDailyIncome)}
                        </span>
                        <span className={`text-[10px] ${avgDailyIncomeChange > 0 ? 'text-emerald-500' : avgDailyIncomeChange < 0 ? 'text-rose-500' : 'text-slate-500 dark:text-zinc-500'}`}>
                          {avgDailyIncomeChange > 0 ? '↑' : avgDailyIncomeChange < 0 ? '↓' : '→'} {Math.abs(avgDailyIncomeChange).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-500 dark:text-zinc-500">
                        {t('dashboard.total_expenses')}
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                          {formatBalanceDisplay(avgDailyExpense)}
                        </span>
                        <span className={`text-[10px] ${avgDailyExpenseChange > 0 ? 'text-rose-500' : avgDailyExpenseChange < 0 ? 'text-emerald-500' : 'text-slate-500 dark:text-zinc-500'}`}>
                          {avgDailyExpenseChange > 0 ? '↑' : avgDailyExpenseChange < 0 ? '↓' : '→'} {Math.abs(avgDailyExpenseChange).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold tracking-tight text-slate-800 dark:text-white mb-4">
                {t('analysis.daily_comparison')}
              </h3>
              <div className="h-[250px] sm:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dailyFlowData}
                    margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.12)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#94A3B8', fontSize: 11 }}
                      tickMargin={10}
                    />
                    <YAxis
                      tick={{
                        fill: '#94A3B8',
                        fontSize: 11,
                        dx: -20
                      }}
                      tickFormatter={(value) => formatBalanceDisplay(value)}
                      tickMargin={8}
                      domain={['auto', 'auto']}
                      allowDuplicatedCategory={false}
                    />
                    <Tooltip
                      formatter={(value: number) => formatBalanceDisplay(value)}
                      labelStyle={{ color: '#334155', fontWeight: 'bold' }}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        padding: '12px'
                      }}
                    />
                    <Bar
                      dataKey="income"
                      fill="#10B981"
                      name={t('dashboard.total_income')}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="expenses"
                      fill="#F43F5E"
                      name={t('dashboard.total_expenses')}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center items-center gap-8 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                    {t('dashboard.total_income')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                  <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                    {t('dashboard.total_expenses')}
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold tracking-tight text-slate-800 dark:text-white mb-4">
                {t('analysis.expense_categories')}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-[250px] sm:h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                      >
                        {categoryChartData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            stroke="none"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatBalanceDisplay(value)}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          padding: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {categoryChartData.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-indigo-50/50 dark:hover:bg-white/[0.02] transition-all duration-150">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 truncate">
                              {t(`categories.${category.category.toLowerCase().replace(' ', '_')}`)}
                            </span>
                            <span className="text-sm font-semibold tracking-tight text-rose-600 dark:text-rose-400 ml-2 flex-shrink-0">
                              {formatBalanceDisplay(category.amount)}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${category.percentage}%`,
                                backgroundColor: COLORS[index % COLORS.length]
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-500">
                            {category.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass-card p-4">
                <h3 className="text-sm font-semibold tracking-tight text-slate-800 dark:text-white mb-4">
                  {t('analysis.monthly_insights')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      {t('analysis.highest_expense_day')}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-400">
                      {dailyFlowData.reduce((max, curr) => curr.expenses > max.expenses ? curr : max).date}
                      {' '}{t('analysis.highest_day')}{' '}
                      {formatBalanceDisplay(dailyFlowData.reduce((max, curr) => curr.expenses > max.expenses ? curr : max).expenses)}
                      {' '}{t('analysis.in_expenses')}
                    </p>
                  </div>

                  {categoryChartData.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        {t('analysis.top_spending')}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-zinc-400">
                        {(() => {
                          const categoryKey = categoryChartData[0].category.toLowerCase().replace(/[\s.]/g, '_');
                          const translatedCategory = t(`categories.${categoryKey}`);
                          // If translation returns the key itself (meaning no translation found), show original category
                          return translatedCategory === `categories.${categoryKey}` ? categoryChartData[0].category : translatedCategory;
                        })()}
                        {' '}{t('analysis.represents')}{' '}
                        {categoryChartData[0].percentage.toFixed(1)}%
                        {' '}{t('analysis.of_total_expenses')}
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      {t('analysis.avg_daily_expense')}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-400">
                      {t('analysis.daily_average_info')}:{' '}
                      {formatBalanceDisplay(totalExpenses / getDaysInMonth(selectedMonth))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4">
                <h3 className="text-sm font-semibold tracking-tight text-slate-800 dark:text-white mb-4">
                  {t('analysis.personalized_tips')}
                </h3>
                <div className="space-y-3">
                  {tips.map((tip, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-indigo-50/50 dark:bg-indigo-500/[0.05] rounded-xl transition-colors"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-700 dark:text-zinc-300 text-xs leading-relaxed">
                          {tip}
                        </p>
                      </div>
                    </div>
                  ))}
                  {tips.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-xs text-slate-500 dark:text-zinc-500">
                        {t('analysis.no_tips')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 sm:bottom-8 right-4 sm:right-8 p-3 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-200"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden z-40">
        <div className="mx-4 mb-4 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border border-white/50 dark:border-white/8 rounded-2xl shadow-xl" style={{ WebkitBackdropFilter: 'blur(40px) saturate(1.3)', backdropFilter: 'blur(40px) saturate(1.3)' }}>
          <div className="flex items-center justify-around h-14 px-2">
            <Link to="/" className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl text-slate-400 dark:text-zinc-500 cursor-pointer">
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-[10px] font-medium">{t('dashboard.title_short')}</span>
            </Link>
            <button className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="h-5 w-5" />
              <span className="text-[10px] font-medium">{t('analysis.title')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
