import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { InternalTransfer, Profile } from '../types/database';
import { format } from 'date-fns';
import { useTranslation } from '../lib/i18n';

const ACCOUNT_TYPES = [
  'checking', 'savings', 'investment', 'credit_card', 'cash', 'other'
] as const;

type InternalTransferFormProps = {
  onClose: () => void;
  onTransferAdded: () => void;
  transfer?: InternalTransfer;
  mode?: 'create' | 'edit';
  profile?: Profile | null;
};

export function InternalTransferForm({ onClose, onTransferAdded, transfer, mode = 'create', profile }: InternalTransferFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: transfer?.amount.toString() || '',
    from_account: transfer?.from_account || ACCOUNT_TYPES[0],
    to_account: transfer?.to_account || ACCOUNT_TYPES[1],
    description: transfer?.description || '',
    date: transfer?.date || format(new Date(), 'yyyy-MM-dd')
  });

  const { t, isRTL } = useTranslation(profile);

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await supabase.auth.getUser();
      if (mode === 'edit' && transfer) {
        const { error } = await supabase
          .from('internal_transfers')
          .update({ ...formData, amount: Number(formData.amount) })
          .eq('id', transfer.id)
          .eq('user_id', user.data.user?.id);
        if (error) throw error;
        toast.success(t('transfer.updated'));
      } else {
        const { error } = await supabase
          .from('internal_transfers')
          .insert([{ user_id: user.data.user?.id, ...formData, amount: Number(formData.amount) }]);
        if (error) throw error;
        toast.success(t('transfer.added'));
      }
      onTransferAdded();
      onClose();
    } catch (error) {
      toast.error(mode === 'edit' ? t('transfer.update_error') : t('transfer.add_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'} onClick={onClose}>
      <div className="glass-modal w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col animate-slide-up-mobile sm:animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/8 shrink-0">
          <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
            {mode === 'edit' ? t('transfer.edit') : t('transfer.new')}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/8 rounded-xl transition-all duration-200 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400/60" />
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="modern-input pl-10 text-lg font-semibold tracking-tight"
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1.5">
                  {t('transfer.from_account')}
                </label>
                <select
                  value={formData.from_account}
                  onChange={(e) => setFormData({ ...formData, from_account: e.target.value })}
                  className="modern-input text-xs"
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <option key={type} value={type}>{t(`accounts.${type}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1.5">
                  {t('transfer.to_account')}
                </label>
                <select
                  value={formData.to_account}
                  onChange={(e) => setFormData({ ...formData, to_account: e.target.value })}
                  className="modern-input text-xs"
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <option key={type} value={type}>{t(`accounts.${type}`)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-indigo-400/60" />
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="modern-input pl-10 resize-none"
                placeholder={t('transfer.description_placeholder')}
                rows={2}
              />
            </div>

            <div className="relative">
              <Calendar className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400/60 pointer-events-none z-10`} />
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={`modern-input ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                style={{ color: 'transparent', colorScheme: 'dark' }}
              />
              <div className={`absolute inset-y-0 ${isRTL ? 'right-10 left-4' : 'left-10 right-4'} flex items-center pointer-events-none text-slate-700 dark:text-white text-sm`}>
                {formData.date ? format(new Date(formData.date), 'dd/MM/yyyy') : ''}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] cursor-pointer bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  <span>{mode === 'edit' ? t('transfer.update') : t('transfer.add')}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
