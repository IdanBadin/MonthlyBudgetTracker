import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Trash2, Pencil, Inbox } from 'lucide-react';
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
      <div className="glass-card p-10 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#f2f4f5] dark:bg-[#94d3c1]/10 flex items-center justify-center mx-auto mb-4">
          <Inbox className="w-6 h-6 text-[#29695b] dark:text-[#94d3c1]" />
        </div>
        <p className="text-slate-700 dark:text-zinc-300 text-sm font-semibold">No transactions found</p>
        <p className="text-slate-400 dark:text-zinc-500 text-xs mt-1">Add a new transaction to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card overflow-hidden">
        <div className="divide-y divide-slate-100/80 dark:divide-white/5">
          {transactionsWithBalance.map((transaction) => {
            const textIsRTL = containsRTL(transaction.description);

            return (
              <div
                key={transaction.id}
                className="px-4 py-3.5 transition-all duration-150 hover:bg-[#f2f4f5]/30 dark:hover:bg-white/[0.02] cursor-default"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-1 h-full min-h-[44px] rounded-full flex-shrink-0 mt-0.5 ${
                    transaction.type === 'income' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <p
                        className="text-sm font-medium text-slate-800 dark:text-white leading-tight truncate"
                        style={{
                          direction: textIsRTL ? 'rtl' : 'ltr',
                          textAlign: textIsRTL ? 'right' : 'left',
                          unicodeBidi: 'isolate',
                        }}
                      >
                        {transaction.description}
                      </p>
                      <span className={`text-sm font-semibold flex-shrink-0 tracking-tight ${
                        transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`} dir="ltr">
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] text-slate-400 dark:text-zinc-600">
                          {format(new Date(transaction.date), 'dd/MM/yy')}
                        </span>
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#f2f4f5] dark:bg-[#94d3c1]/10 text-[#29695b] dark:text-[#94d3c1] truncate max-w-[100px]">
                          {(() => {
                            const categoryKey = formatCategoryKey(transaction.category);
                            const translatedCategory = t(`categories.${categoryKey}`);
                            return translatedCategory === `categories.${categoryKey}` ? transaction.category : translatedCategory;
                          })()}
                        </span>
                      </div>
                      <span className={`text-[11px] font-semibold tracking-tight ${
                        transaction.runningBalance >= 0
                          ? 'text-[#006a63] dark:text-[#71d7cd]'
                          : 'text-rose-500 dark:text-rose-400'
                      }`} dir="ltr">
                        {formatCurrency(transaction.runningBalance)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 flex-shrink-0 mt-0.5">
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
