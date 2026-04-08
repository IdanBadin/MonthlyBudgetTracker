import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Tag, FileText, ChevronDown, Briefcase, ShoppingBag, Home, Car, Heart, Laptop, Plane, Gift, Plus, Send, Coffee } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Transaction, Profile } from '../types/database';
import { format } from 'date-fns';
import { useTranslation } from '../lib/i18n';

const CATEGORIES = [
  { id: 'salary', name: 'salary', icon: Briefcase, color: 'emerald' },
  { id: 'freelance', name: 'freelance', icon: Laptop, color: 'cyan' },
  { id: 'investments', name: 'investments', icon: DollarSign, color: 'teal' },
  { id: 'bit_transfer', name: 'bit_transfer', icon: Send, color: 'sky' },
  { id: 'food', name: 'food', icon: Coffee, color: 'amber' },
  { id: 'rent', name: 'rent', icon: Home, color: 'orange' },
  { id: 'utilities', name: 'utilities', icon: Home, color: 'yellow' },
  { id: 'groceries', name: 'groceries', icon: ShoppingBag, color: 'green' },
  { id: 'transportation', name: 'transportation', icon: Car, color: 'red' },
  { id: 'entertainment', name: 'entertainment', icon: Heart, color: 'pink' },
  { id: 'travel', name: 'travel', icon: Plane, color: 'sky' },
  { id: 'shopping', name: 'shopping', icon: Gift, color: 'rose' },
  { id: 'other', name: 'other', icon: Plus, color: 'slate' },
  { id: 'custom', name: 'custom', icon: Tag, color: 'cyan' }
];

const colorMap: Record<string, string> = {
  emerald: 'bg-emerald-500 text-white',
  cyan: 'bg-cyan-500 text-white',
  teal: 'bg-teal-500 text-white',
  sky: 'bg-sky-500 text-white',
  amber: 'bg-amber-500 text-white',
  orange: 'bg-orange-500 text-white',
  yellow: 'bg-yellow-500 text-white',
  green: 'bg-green-500 text-white',
  red: 'bg-red-500 text-white',
  pink: 'bg-pink-500 text-white',
  rose: 'bg-rose-500 text-white',
  slate: 'bg-slate-500 text-white',
};

type TransactionFormProps = {
  onClose: () => void;
  onTransactionAdded: () => void;
  transaction?: Transaction;
  mode?: 'create' | 'edit';
  profile?: Profile | null;
};

export function TransactionForm({ onClose, onTransactionAdded, transaction, mode = 'create', profile }: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [formData, setFormData] = useState({
    type: transaction?.type || 'expense',
    amount: transaction?.amount.toString() || '',
    category: transaction?.category || CATEGORIES[0].name,
    description: transaction?.description || '',
    date: transaction?.date || format(new Date(), 'yyyy-MM-dd')
  });

  const { t, isRTL } = useTranslation(profile);

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);
  const selectedCategory = CATEGORIES.find(cat => cat.name === formData.category) || CATEGORIES[0];
  const CategoryIcon = selectedCategory.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await supabase.auth.getUser();
      const finalCategory = showCustomCategoryInput ? customCategory : formData.category;
      if (mode === 'edit' && transaction) {
        const { error } = await supabase
          .from('transactions')
          .update({ ...formData, category: finalCategory, amount: Number(formData.amount) })
          .eq('id', transaction.id)
          .eq('user_id', user.data.user?.id);
        if (error) throw error;
        toast.success(t('transaction.updated'));
      } else {
        const { error } = await supabase
          .from('transactions')
          .insert([{ user_id: user.data.user?.id, ...formData, category: finalCategory, amount: Number(formData.amount) }]);
        if (error) throw error;
        toast.success(t('transaction.added'));
      }
      onTransactionAdded();
      onClose();
    } catch (error) {
      toast.error(mode === 'edit' ? t('transaction.update_error') : t('transaction.add_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'} onClick={onClose}>
      <div className="glass-modal w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col animate-slide-up-mobile sm:animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#bfc9c4]/30 dark:border-white/8 shrink-0">
          <h2 className="text-base font-semibold font-manrope tracking-tight text-[#191c1d] dark:text-white">
            {mode === 'edit' ? t('transaction.edit') : t('transaction.new')}
          </h2>
          <button onClick={onClose} className="p-2 text-[#707975] hover:text-[#3f4945] dark:hover:text-zinc-300 hover:bg-[#f2f4f5] dark:hover:bg-white/8 rounded-xl transition-all duration-200 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="flex items-center gap-1 p-1 bg-[#f2f4f5] dark:bg-white/5 rounded-xl">
              {['income', 'expense'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type })}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    formData.type === type
                      ? type === 'income'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-[#ba1a1a] text-white shadow-sm'
                      : 'text-[#3f4945] dark:text-zinc-400'
                  }`}
                >
                  {t(`transaction.${type}`)}
                </button>
              ))}
            </div>

            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#29695b]/60" />
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

            <div className="relative">
              {showCustomCategoryInput ? (
                <div className="relative">
                  <Tag className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-[#29695b]/60`} />
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className={`modern-input ${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'}`}
                    placeholder={t('transaction.custom_category')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomCategoryInput(false)}
                    className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-[#707975] hover:text-[#3f4945] cursor-pointer`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCategories(!showCategories)}
                  className="w-full flex items-center gap-2.5 px-3 py-3 bg-[#f2f4f5]/60 dark:bg-white/[0.04] border border-[#e6e8e9] dark:border-white/10 rounded-xl transition-all duration-200 text-sm hover:border-[#94d3c1] dark:hover:border-white/20 cursor-pointer"
                >
                  <div className={`p-1.5 rounded-lg ${colorMap[selectedCategory.color]}`}>
                    <CategoryIcon className="h-3.5 w-3.5" />
                  </div>
                  <span className="flex-1 text-left font-medium text-[#191c1d] dark:text-white text-sm">
                    {t(`categories.${selectedCategory.id}`)}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-[#707975] transition-transform ${showCategories ? 'rotate-180' : ''}`} />
                </button>
              )}

              {showCategories && (
                <div className="absolute top-full left-0 right-0 mt-1.5 p-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/50 border border-[#e6e8e9] dark:border-white/10 grid grid-cols-2 gap-1.5 z-50 max-h-48 overflow-y-auto">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        if (category.id === 'custom') {
                          setShowCustomCategoryInput(true);
                          setShowCategories(false);
                        } else {
                          setFormData({ ...formData, category: category.name });
                          setShowCategories(false);
                        }
                      }}
                      className={`flex items-center gap-2 p-2.5 rounded-xl transition-all duration-150 text-xs cursor-pointer ${
                        formData.category === category.name
                          ? colorMap[category.color]
                          : 'hover:bg-[#f2f4f5] dark:hover:bg-white/5 text-[#191c1d] dark:text-zinc-200'
                      }`}
                    >
                      <category.icon className="h-3.5 w-3.5" />
                      <span>{t(`categories.${category.id}`)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-[#29695b]/60" />
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="modern-input pl-10 resize-none"
                placeholder={t('transaction.description_placeholder')}
                rows={2}
              />
            </div>

            <div className="relative">
              <Calendar className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-[#29695b]/60 pointer-events-none z-10`} />
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={`modern-input ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                style={{ color: 'transparent', colorScheme: 'dark' }}
              />
              <div
                className={`absolute inset-y-0 ${isRTL ? 'right-10 left-4' : 'left-10 right-4'} flex items-center pointer-events-none text-[#191c1d] dark:text-white text-sm`}
              >
                {formData.date ? format(new Date(formData.date), 'dd/MM/yyyy') : ''}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] cursor-pointer bg-gradient-to-r from-[#29695b] to-[#00342b] hover:from-[#004d40] hover:to-[#00342b] shadow-lg shadow-[#00342b]/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{mode === 'edit' ? t('transaction.update') : t('transaction.add')}</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
