import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { Transaction, Profile } from '../types/database';
import { useTranslation } from '../lib/i18n';

type TransactionDetailsModalProps = {
  transactions: Transaction[];
  type: 'income' | 'expense';
  onClose: () => void;
  profile?: Profile | null;
};

export function TransactionDetailsModal({ transactions, type, onClose, profile }: TransactionDetailsModalProps) {
  const { t, formatCurrency, isRTL } = useTranslation(profile);

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const groupedByCategory = transactions.reduce((acc, transaction) => {
    acc[transaction.category] = (acc[transaction.category] || 0) + Number(transaction.amount);
    return acc;
  }, {} as Record<string, number>);

  const categoryPercentages = Object.entries(groupedByCategory).map(([category, amount]) => ({
    category,
    amount,
    percentage: (amount / total) * 100
  })).sort((a, b) => b.amount - a.amount);

  const formatCategoryKey = (category: string) => {
    return category.toLowerCase().replace(/[\s.]/g, '_');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'} onClick={onClose}>
      <div className="glass-modal w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col animate-slide-up-mobile sm:animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/8 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
              type === 'income' ? 'bg-emerald-100 dark:bg-emerald-500/15' : 'bg-rose-100 dark:bg-rose-500/15'
            }`}>
              {type === 'income' ? (
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                {type === 'income' ? t('dashboard.total_income') : t('dashboard.total_expenses')}
              </h2>
              <p className={`text-sm font-bold tabular-nums ${
                type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {formatCurrency(total)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/8 rounded-xl transition-all duration-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">{t('transaction.by_category')}</h3>
              <div className="space-y-3">
                {categoryPercentages.map(({ category, amount, percentage }) => (
                  <div key={category} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-zinc-200 text-xs">
                        {(() => {
                          const categoryKey = formatCategoryKey(category);
                          const translatedCategory = t(`categories.${categoryKey}`);
                          return translatedCategory === `categories.${categoryKey}` ? category : translatedCategory;
                        })()}
                      </span>
                      <span className="text-xs tabular-nums text-slate-500 dark:text-zinc-400">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-3">{t('transaction.recent')}</h3>
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/8 rounded-xl transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{transaction.description}</p>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                          {(() => {
                            const categoryKey = formatCategoryKey(transaction.category);
                            const translatedCategory = t(`categories.${categoryKey}`);
                            return translatedCategory === `categories.${categoryKey}` ? transaction.category : translatedCategory;
                          })()}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className={`text-sm font-semibold tabular-nums ${
                          type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {formatCurrency(Number(transaction.amount))}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                          {format(new Date(transaction.date), 'dd/MM/yy')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
