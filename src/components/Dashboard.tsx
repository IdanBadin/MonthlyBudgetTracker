import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format, isValid, subMonths } from 'date-fns';
import { PlusCircle, DollarSign, TrendingUp, TrendingDown, LogOut, Settings, Eye, EyeOff, ArrowLeftRight, Wallet, LayoutDashboard, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Transaction, Profile, InternalTransfer } from '../types/database';
import { TransactionForm } from './TransactionForm';
import { TransactionList } from './TransactionList';
import { TransactionDetailsModal } from './TransactionDetailsModal';
import { MonthSelector } from './MonthSelector';
import { SettingsModal } from './SettingsModal';
import { useTranslation } from '../lib/i18n';
import { AdvancedSearch } from './AdvancedSearch';
import { InternalTransferForm } from './InternalTransferForm';
import { InternalTransferList } from './InternalTransferList';
import { YearlyProfitLoss } from './YearlyProfitLoss';
import { CumulativeProfitSelector } from './CumulativeProfitSelector';
import { DashboardSkeleton, TransactionListSkeleton } from './Skeleton';
import toast from 'react-hot-toast';

type DashboardProps = {
  profile: Profile | null;
  onProfileUpdate: () => void;
};

export function Dashboard({ profile, onProfileUpdate }: DashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<InternalTransfer[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTransferFormOpen, setIsTransferFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTransactionType, setSelectedTransactionType] = useState<'income' | 'expense' | null>(null);
  const [startingBalance, setStartingBalance] = useState<number | null>(null);
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [newBalance, setNewBalance] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'yearly' | 'cumulative'>('current');
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [showBalances, setShowBalances] = useState(() => profile?.dashboard_settings?.showBalance ?? true);

  const { t, formatCurrency, isRTL } = useTranslation(profile);

  const minAllowedDate = React.useMemo(() => {
    const retentionMonths = profile?.data_retention_months || 6;
    return subMonths(new Date(), retentionMonths);
  }, [profile?.data_retention_months]);

  useEffect(() => {
    if (profile?.dashboard_settings?.showBalance !== undefined) {
      setShowBalances(profile.dashboard_settings.showBalance);
    }
  }, [profile?.dashboard_settings?.showBalance]);

  useEffect(() => {
    const firstDayOfMinMonth = new Date(minAllowedDate.getFullYear(), minAllowedDate.getMonth(), 1);
    if (selectedMonth < firstDayOfMinMonth) {
      setSelectedMonth(firstDayOfMinMonth);
    }
  }, [selectedMonth, minAllowedDate]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      await Promise.all([
        fetchTransactions(user.id),
        fetchTransfers(user.id),
        fetchStartingBalance(user.id)
      ]);
    };
    fetchAll();
  }, [selectedMonth, minAllowedDate]);

  useEffect(() => {
    setFilteredTransactions(transactions);
  }, [transactions]);

  const fetchStartingBalance = async (userId?: string) => {
    try {
      let uid = userId;
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        uid = user.id;
      }
      const startDate = format(selectedMonth, 'yyyy-MM-01');
      const minAllowedDateStr = format(minAllowedDate, 'yyyy-MM-01');
      const { data, error } = await supabase
        .from('starting_balances')
        .select('amount')
        .eq('user_id', uid)
        .eq('month', startDate)
        .gte('month', minAllowedDateStr)
        .maybeSingle();
      if (error) throw error;
      setStartingBalance(data?.amount ?? null);
    } catch (error) {
      console.error('Error fetching starting balance:', error);
      toast.error(t('dashboard.balance_update_error'));
    }
  };

  const fetchTransactions = async (userId?: string) => {
    try {
      let uid = userId;
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        uid = user.id;
      }
      const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      const minAllowedDateStr = format(minAllowedDate, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', uid)
        .gte('date', format(startOfMonth, 'yyyy-MM-dd'))
        .lte('date', format(endOfMonth, 'yyyy-MM-dd'))
        .gte('date', minAllowedDateStr)
        .order('date', { ascending: false });
      if (error) throw error;
      setTransactions(data || []);
      setFilteredTransactions(data || []);
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransfers = async (userId?: string) => {
    try {
      let uid = userId;
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        uid = user.id;
      }
      const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      const minAllowedDateStr = format(minAllowedDate, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('internal_transfers')
        .select('*')
        .eq('user_id', uid)
        .gte('date', format(startOfMonth, 'yyyy-MM-dd'))
        .lte('date', format(endOfMonth, 'yyyy-MM-dd'))
        .gte('date', minAllowedDateStr)
        .order('date', { ascending: false });
      if (error) throw error;
      setTransfers(data || []);
    } catch (error) {
      toast.error('Failed to fetch transfers');
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const handleMonthChange = (date: Date) => {
    if (isValid(date)) {
      const firstDayOfMinMonth = new Date(minAllowedDate.getFullYear(), minAllowedDate.getMonth(), 1);
      const newMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      if (newMonth < firstDayOfMinMonth) {
        setSelectedMonth(firstDayOfMinMonth);
      } else {
        setSelectedMonth(newMonth);
      }
    }
  };

  const handleSearch = (filters: any) => {
    let filtered = [...transactions];
    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }
    if (filters.category) {
      const normalizedFilterCategory = filters.category.toLowerCase().trim();
      filtered = filtered.filter(t => t.category.toLowerCase().trim() === normalizedFilterCategory);
    }
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(searchTerm) ||
        t.category.toLowerCase().includes(searchTerm)
      );
    }
    if (filters.minAmount) {
      filtered = filtered.filter(t => Number(t.amount) >= Number(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(t => Number(t.amount) <= Number(filters.maxAmount));
    }
    if (filters.startDate) {
      const minAllowedDateStr = format(minAllowedDate, 'yyyy-MM-dd');
      const effectiveStartDate = filters.startDate < minAllowedDateStr ? minAllowedDateStr : filters.startDate;
      filtered = filtered.filter(t => t.date >= effectiveStartDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(t => t.date <= filters.endDate);
    }
    setFilteredTransactions(filtered);
  };

  const { totalIncome, totalExpenses } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const t of filteredTransactions) {
      if (t.type === 'income') income += Number(t.amount);
      else expenses += Number(t.amount);
    }
    return { totalIncome: income, totalExpenses: expenses };
  }, [filteredTransactions]);

  const transfersBalance = useMemo(() => {
    return transfers.reduce((sum, t) => {
      const transferAmount = Number(t.amount);
      if (t.from_account === 'checking') return sum - transferAmount;
      if (t.to_account === 'checking') return sum + transferAmount;
      return sum;
    }, 0);
  }, [transfers]);

  const balance = (startingBalance || 0) + totalIncome - totalExpenses + transfersBalance;
  const monthlyProfitLoss = totalIncome - totalExpenses;
  const isProfit = monthlyProfitLoss >= 0;

  const handleSaveBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const startDate = format(selectedMonth, 'yyyy-MM-01');
      const minAllowedDateStr = format(minAllowedDate, 'yyyy-MM-01');
      if (startDate < minAllowedDateStr) {
        toast.error('Cannot save balance for dates outside retention period');
        return;
      }
      const { error } = await supabase
        .from('starting_balances')
        .upsert({
          user_id: user.id,
          month: startDate,
          amount: Number(newBalance)
        }, { onConflict: 'user_id,month' });
      if (error) throw error;
      setStartingBalance(Number(newBalance));
      setIsEditingBalance(false);
      toast.success(t('dashboard.balance_updated'));
    } catch (error) {
      console.error('Error saving starting balance:', error);
      toast.error(t('dashboard.balance_update_error'));
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
      onProfileUpdate();
    } catch (error) {
      console.error('Error updating balance visibility:', error);
      setShowBalances(!showBalances);
      toast.error(t('settings.update_error'));
    }
  };

  const formatBalanceDisplay = (amount: number) => {
    return showBalances ? formatCurrency(amount) : '------';
  };

  return (
    <div className="min-h-screen bg-[#f8fafb] dark:bg-[#111816] pb-20 sm:pb-6">
      <div className="fixed top-0 left-0 right-0 z-30 modern-header">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#00342b] shadow-md shadow-[#00342b]/30">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-sm font-semibold font-manrope text-[#191c1d] dark:text-white tracking-tight truncate">
                {t('dashboard.financial_dashboard')}
              </h1>
            </div>

            <div className="hidden sm:flex items-center gap-1.5">
              <Link
                to="/analysis"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#3f4945] dark:text-zinc-400 hover:bg-[#f2f4f5] dark:hover:bg-white/5 hover:text-[#00342b] dark:hover:text-[#94d3c1] transition-all duration-200 cursor-pointer"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>{t('analysis.title')}</span>
              </Link>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#3f4945] dark:text-zinc-400 hover:bg-[#f2f4f5] dark:hover:bg-white/5 hover:text-[#00342b] dark:hover:text-[#94d3c1] transition-all duration-200 cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>{t('settings.title')}</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#3f4945] dark:text-zinc-400 hover:bg-[#f2f4f5] dark:hover:bg-white/5 hover:text-[#00342b] dark:hover:text-[#94d3c1] transition-all duration-200 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3.5rem + 1rem)' }}>
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={handleMonthChange}
          profile={profile}
          minAllowedDate={minAllowedDate}
        />

        {/* Hero Current Balance Card */}
        <div className="relative rounded-2xl overflow-hidden mb-4 content-fade-in" style={{ background: 'linear-gradient(135deg, #004D40 0%, #00342b 100%)' }}>
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
          <div className="relative p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/70">{t('dashboard.current_balance')}</p>
              <button
                onClick={toggleBalanceVisibility}
                className="p-1.5 text-white/60 hover:text-white transition-colors rounded-lg cursor-pointer"
              >
                {showBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-4xl font-bold tracking-tight text-white mb-3 font-manrope" style={{ fontVariantNumeric: 'tabular-nums' }} dir="ltr">
              {formatBalanceDisplay(balance)}
            </p>
            <div className="flex items-center gap-1.5">
              {isProfit
                ? <TrendingUp className="h-3.5 w-3.5 text-emerald-300 flex-shrink-0" />
                : <TrendingDown className="h-3.5 w-3.5 text-rose-300 flex-shrink-0" />
              }
              <span className={`text-sm font-medium ${isProfit ? 'text-emerald-300' : 'text-rose-300'}`} dir="ltr">
                {isProfit ? '+' : '-'}{formatBalanceDisplay(Math.abs(monthlyProfitLoss))}
              </span>
              <span className="text-white/50 text-xs">{t('dashboard.this_month')}</span>
            </div>
          </div>
        </div>

        {/* Income + Expense Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4 content-fade-in">
          <button
            onClick={() => setSelectedTransactionType('income')}
            className="stat-card text-start cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">{t('dashboard.total_income')}</p>
              <div className="h-9 w-9 rounded-full bg-[#E8F8F6] dark:bg-[#4DB8AC]/15 flex items-center justify-center flex-shrink-0">
                <TrendingDown className="h-4 w-4 text-[#4DB8AC]" />
              </div>
            </div>
            <p className="text-xl font-bold tracking-tight text-[#00695C] dark:text-[#4DB8AC]" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatBalanceDisplay(totalIncome)}</p>
            <p className="text-[10px] text-slate-400 dark:text-zinc-600 mt-0.5">{t('dashboard.this_month')}</p>
          </button>

          <button
            onClick={() => setSelectedTransactionType('expense')}
            className="stat-card text-start cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">{t('dashboard.total_expenses')}</p>
              <div className="h-9 w-9 rounded-full bg-[#FFEBEB] dark:bg-[#E57373]/15 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-[#E57373]" />
              </div>
            </div>
            <p className="text-xl font-bold tracking-tight text-[#C62828] dark:text-[#E57373]" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatBalanceDisplay(totalExpenses)}</p>
            <p className="text-[10px] text-slate-400 dark:text-zinc-600 mt-0.5">{t('dashboard.this_month')}</p>
          </button>
        </div>

        {/* Starting Balance + Monthly Profit */}
        <div className="grid grid-cols-2 gap-3 mb-4 content-fade-in">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-500">{t('dashboard.starting_balance')}</p>
              <button
                onClick={() => {
                  setNewBalance(startingBalance?.toString() || '');
                  setIsEditingBalance(true);
                }}
                className="text-[10px] text-[#29695b] dark:text-[#94d3c1] hover:underline cursor-pointer"
              >
                {t('common.edit') || 'Edit'}
              </button>
            </div>
            {isEditingBalance ? (
              <div className="flex gap-1 mt-1">
                <input
                  type="number"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="modern-input px-2 py-1 text-xs flex-1"
                  placeholder="0"
                />
                <button onClick={handleSaveBalance} className="px-2 py-1 bg-[#004D40] text-white rounded-lg text-[10px] font-semibold cursor-pointer">
                  ✓
                </button>
                <button onClick={() => setIsEditingBalance(false)} className="px-2 py-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-400 rounded-lg text-[10px] cursor-pointer">
                  ✕
                </button>
              </div>
            ) : (
              <p className="text-lg font-bold tracking-tight text-[#00342b] dark:text-[#94d3c1]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatBalanceDisplay(startingBalance || 0)}
              </p>
            )}
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-500">
                {isProfit ? t('dashboard.monthly_profit') : t('dashboard.monthly_loss')}
              </p>
              <div className={`h-6 w-6 rounded-full flex items-center justify-center ${isProfit ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-rose-50 dark:bg-rose-500/10'}`}>
                {isProfit ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-rose-500" />}
              </div>
            </div>
            <p className={`text-lg font-bold tracking-tight ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatBalanceDisplay(Math.abs(monthlyProfitLoss))}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-zinc-600 mt-0.5">{t('dashboard.this_month')}</p>
          </div>
        </div>

        <div className="glass-card p-4 mb-4 content-fade-in-delay-1">
          <div className="flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-white/5 rounded-xl mb-4">
            {(['current', 'yearly', 'cumulative'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-white dark:bg-white/10 text-[#00342b] dark:text-[#94d3c1] shadow-sm font-semibold'
                    : 'text-[#3f4945] dark:text-zinc-500 cursor-pointer'
                }`}
              >
                {tab === 'current' ? t('dashboard.current_balance') : tab === 'yearly' ? t('analysis.yearly_view') : t('analysis.cumulative_profit')}
              </button>
            ))}
          </div>

          {activeTab === 'current' ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('dashboard.current_balance')}</p>
                <p className={`text-2xl font-bold tracking-tight ${balance >= 0 ? 'text-[#00342b] dark:text-[#94d3c1]' : 'text-rose-600 dark:text-rose-400'}`}>
                  {formatBalanceDisplay(balance)}
                </p>
                <p className="text-[10px] text-[#707975] dark:text-zinc-600 mt-0.5">{t('dashboard.available')}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-[#f2f4f5] dark:bg-[#94d3c1]/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#00342b] dark:text-[#94d3c1]" />
              </div>
            </div>
          ) : activeTab === 'yearly' ? (
            <YearlyProfitLoss profile={profile} selectedYear={selectedYear} onYearChange={setSelectedYear} />
          ) : (
            <CumulativeProfitSelector profile={profile} />
          )}
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <AdvancedSearch profile={profile} onSearch={handleSearch} minAllowedDate={minAllowedDate} />
          <div className="flex gap-2">
            <button onClick={() => setIsFormOpen(true)} className="primary-button flex-1 flex items-center justify-center gap-2 text-sm cursor-pointer">
              <PlusCircle className="h-4 w-4" />
              <span>{t('dashboard.add_transaction')}</span>
            </button>
            <button onClick={() => setIsTransferFormOpen(true)} className="success-button flex-1 flex items-center justify-center gap-2 text-sm cursor-pointer">
              <ArrowLeftRight className="h-4 w-4" />
              <span>{t('transfer.new')}</span>
            </button>
          </div>
        </div>

        {loading ? (
          <TransactionListSkeleton count={5} />
        ) : (
          <>
            <TransactionList
              transactions={filteredTransactions}
              onTransactionUpdated={fetchTransactions}
              profile={profile}
              startingBalance={startingBalance}
            />

            {transfers.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-[#191c1d] dark:text-white mb-3 flex items-center gap-2 tracking-tight mt-4">
                  <ArrowLeftRight className="h-4 w-4 text-[#00342b]" />
                  {t('transfer.internal_transfers')}
                </h3>
                <InternalTransferList transfers={transfers} onTransferUpdated={fetchTransfers} profile={profile} />
              </div>
            )}
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 sm:hidden z-40">
        <div className="mx-4 mb-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-[#bfc9c4]/30 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/40" style={{ WebkitBackdropFilter: 'blur(40px) saturate(1.3)', backdropFilter: 'blur(40px) saturate(1.3)' }}>
          <div className="flex items-center justify-around h-14 px-2">
            <button className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl bg-[#f2f4f5] dark:bg-[#94d3c1]/10 text-[#00342b] dark:text-[#94d3c1]">
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-[10px] font-medium">{t('dashboard.title_short')}</span>
            </button>
            <Link to="/analysis" className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl text-[#707975] dark:text-zinc-500 hover:text-[#3f4945] dark:hover:text-zinc-300 transition-colors cursor-pointer">
              <BarChart3 className="h-5 w-5" />
              <span className="text-[10px] font-medium">{t('analysis.title')}</span>
            </Link>
            <button onClick={() => setIsSettingsOpen(true)} className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl text-[#707975] dark:text-zinc-500 hover:text-[#3f4945] dark:hover:text-zinc-300 transition-colors cursor-pointer">
              <Settings className="h-5 w-5" />
              <span className="text-[10px] font-medium">{t('settings.title')}</span>
            </button>
            <button onClick={handleSignOut} className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl text-[#707975] dark:text-zinc-500 hover:text-[#3f4945] dark:hover:text-zinc-300 transition-colors cursor-pointer">
              <LogOut className="h-5 w-5" />
              <span className="text-[10px] font-medium">{t('common.sign_out')}</span>
            </button>
          </div>
        </div>
      </div>

      {isFormOpen && (
        <TransactionForm onClose={() => setIsFormOpen(false)} onTransactionAdded={fetchTransactions} profile={profile} />
      )}
      {isTransferFormOpen && (
        <InternalTransferForm onClose={() => setIsTransferFormOpen(false)} onTransferAdded={fetchTransfers} profile={profile} />
      )}
      {selectedTransactionType && (
        <TransactionDetailsModal
          transactions={selectedTransactionType === 'income' ? filteredTransactions.filter(t => t.type === 'income') : filteredTransactions.filter(t => t.type === 'expense')}
          type={selectedTransactionType}
          onClose={() => setSelectedTransactionType(null)}
          profile={profile}
        />
      )}
      {isSettingsOpen && profile && (
        <SettingsModal profile={profile} onClose={() => setIsSettingsOpen(false)} onUpdate={onProfileUpdate} />
      )}
    </div>
  );
}
