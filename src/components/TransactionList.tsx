import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Trash2, Pencil, Inbox, TrendingDown, TrendingUp } from 'lucide-react';
import { Transaction, Profile } from '../types/database';
import { supabase } from '../lib/supabase';
import { TransactionForm } from './TransactionForm';
import toast from 'react-hot-toast';
import { useTranslation } from '../lib/i18n';

type TransactionListProps = {
  transactions: Transaction[];
  onTransactionUpdated: () => void;
  profile?: Profile | null;
  startingBalance?: number;
};

export function TransactionList({ transactions, onTransactionUpdated, profile, startingBalance = 0 }: TransactionListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { t, formatCurrency, isRTL } = useTranslation(profile);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      toast.success('Transaction deleted successfully');
      onTransactionUpdated();
    } catch (error) {
      toast.error('Failed to delete transaction');
    } finally {
      setDeletingId(null);
    }
  };

  const containsRTL = (text: string) => {
    const rtlRegex = /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
    return rtlRegex.test(text);
  };

  const formatCategoryKey = (category: string) => {
    return category.toLowerCase().replace(/[\s.]/g, '_');
  };

  // Optimized O(n) running balance calculation with memoization
  const transactionsWithBalance = useMemo(() => {
    // Single pass from end to start - O(n) instead of O(n²)
    let runningBalance = startingBalance;
    const result: Array<Transaction & { runningBalance: number }> = [];

    // Process from newest (end) to oldest (start)
    for (let i = transactions.length - 1; i >= 0; i--) {
      const t = transactions[i];
      if (t.type === 'income') {
        runningBalance += Number(t.amount);
      } else {
        runningBalance -= Number(t.amount);
      }
      result.unshift({ ...t, runningBalance });
    }

    return result;
  }, [transactions, startingBalance]);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <div className="w-16 h-16 rounded-3xl bg-[#f2f4f5] dark:bg-[#94d3c1]/10 flex items-center justify-center mx-auto mb-4">
          <Inbox className="w-7 h-7 text-[#29695b] dark:text-[#94d3c1]" />
        </div>
        <p className="text-[#191c1d] dark:text-zinc-300 text-sm font-bold font-manrope">No transactions found</p>
        <p className="text-[#707975] dark:text-zinc-500 text-xs mt-1">Add a new transaction to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 pb-6">
        {transactionsWithBalance.map((transaction) => {
            const textIsRTL = containsRTL(transaction.description);

            return (
              <div
                key={transaction.id}
                className="flex items-center p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_4px_12px_rgba(25,28,29,0.02)] dark:shadow-none hover:shadow-[0_4px_16px_rgba(25,28,29,0.06)] transition-all duration-200"
              >
                {/* Category icon container */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ml-4 ${
                  transaction.type === 'income'
                    ? 'bg-[#8bf1e6]/30 text-[#006a63]'
                    : 'bg-[#e6e8e9] dark:bg-white/8 text-[#00342b] dark:text-[#94d3c1]'
                }`}>
                  {transaction.type === 'income'
                    ? <TrendingDown className="h-5 w-5" />
                    : <TrendingUp className="h-5 w-5" />
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-bold text-[#191c1d] dark:text-white text-sm leading-tight truncate"
                    style={{
                      direction: textIsRTL ? 'rtl' : 'ltr',
                      textAlign: isRTL ? 'right' : (textIsRTL ? 'right' : 'left'),
                      unicodeBidi: 'isolate',
                    }}
                  >
                    {transaction.description}
                  </p>
                  <p className="text-[11px] text-[#3f4945] dark:text-zinc-500 mt-0.5">
                    {format(new Date(transaction.date), 'dd/MM/yy')} • {(() => {
                      const categoryKey = formatCategoryKey(transaction.category);
                      const translatedCategory = t(`categories.${categoryKey}`);
                      return translatedCategory === `categories.${categoryKey}` ? transaction.category : translatedCategory;
                    })()}
                  </p>
                </div>

                {/* Amount + actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <span className={`font-bold font-manrope text-sm ${
                      transaction.type === 'income' ? 'text-[#006a63] dark:text-[#4DB8AC]' : 'text-[#5e0c14] dark:text-rose-400'
                    }`} dir="ltr">
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                    </span>
                    <p className={`text-[10px] font-semibold ${
                      transaction.runningBalance >= 0
                        ? 'text-[#006a63] dark:text-[#71d7cd]'
                        : 'text-rose-500 dark:text-rose-400'
                    }`} dir="ltr">
                      {formatCurrency(transaction.runningBalance)}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => setEditingTransaction(transaction)}
                      className="p-1.5 text-[#bfc9c4] dark:text-zinc-600 hover:text-[#00342b] dark:hover:text-[#94d3c1] hover:bg-[#f2f4f5] dark:hover:bg-[#94d3c1]/10 rounded-lg transition-all duration-150 cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      disabled={deletingId === transaction.id}
                      className="p-1.5 text-slate-300 dark:text-zinc-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all duration-150 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {editingTransaction && (
        <TransactionForm
          mode="edit"
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onTransactionAdded={onTransactionUpdated}
          profile={profile}
        />
      )}
    </>
  );
}
