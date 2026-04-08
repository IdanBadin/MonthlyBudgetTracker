import React, { useState } from 'react';
import { format } from 'date-fns';
import { Trash2, Pencil, ArrowRight } from 'lucide-react';
import { InternalTransfer, Profile } from '../types/database';
import { supabase } from '../lib/supabase';
import { InternalTransferForm } from './InternalTransferForm';
import toast from 'react-hot-toast';
import { useTranslation } from '../lib/i18n';

type InternalTransferListProps = {
  transfers: InternalTransfer[];
  onTransferUpdated: () => void;
  profile?: Profile | null;
};

export function InternalTransferList({ transfers, onTransferUpdated, profile }: InternalTransferListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingTransfer, setEditingTransfer] = useState<InternalTransfer | null>(null);
  const { t, formatCurrency, isRTL } = useTranslation(profile);

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('transfer.confirm_delete'))) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from('internal_transfers').delete().eq('id', id);
      if (error) throw error;
      toast.success(t('transfer.deleted'));
      onTransferUpdated();
    } catch (error) {
      toast.error(t('transfer.delete_error'));
    } finally {
      setDeletingId(null);
    }
  };

  const containsRTL = (text: string) => {
    const rtlRegex = /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
    return rtlRegex.test(text);
  };

  if (transfers.length === 0) return null;

  return (
    <>
      <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
        {transfers.map((transfer) => {
          const textIsRTL = containsRTL(transfer.description);

          return (
            <div key={transfer.id} className="py-3 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-1 min-h-[36px] rounded-full flex-shrink-0 mt-0.5 bg-[#29695b]" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <p
                      className="text-sm font-medium text-slate-900 dark:text-white leading-tight truncate"
                      style={{
                        direction: textIsRTL ? 'rtl' : 'ltr',
                        textAlign: textIsRTL ? 'right' : 'left',
                      }}
                    >
                      {transfer.description}
                    </p>
                    <span className="text-sm font-semibold tabular-nums text-[#006a63] dark:text-[#71d7cd] flex-shrink-0">
                      {formatCurrency(Number(transfer.amount))}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                      {format(new Date(transfer.date), 'dd/MM/yy')}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1" dir="ltr">
                      {t(`accounts.${transfer.from_account}`)}
                      <ArrowRight className="h-2.5 w-2.5 flex-shrink-0 text-[#29695b]/60" />
                      {t(`accounts.${transfer.to_account}`)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                  <button
                    onClick={() => setEditingTransfer(transfer)}
                    className="p-1.5 text-slate-400 hover:text-[#00342b] dark:hover:text-[#94d3c1] hover:bg-[#f2f4f5] dark:hover:bg-[#94d3c1]/10 rounded-lg transition-all duration-200 cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(transfer.id)}
                    disabled={deletingId === transfer.id}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all duration-200 disabled:opacity-40 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editingTransfer && (
        <InternalTransferForm
          mode="edit"
          transfer={editingTransfer}
          onClose={() => setEditingTransfer(null)}
          onTransferAdded={onTransferUpdated}
          profile={profile}
        />
      )}
    </>
  );
}
