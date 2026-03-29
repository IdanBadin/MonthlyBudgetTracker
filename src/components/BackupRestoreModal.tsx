import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Download, Upload, Loader2, Archive, Clock, AlertTriangle, Fingerprint } from 'lucide-react';
import { getBackups, restoreFromBackup, createBackup } from '../lib/backup';
import { verifyBiometrics } from '../lib/biometrics';
import { Profile } from '../types/database';
import { useTranslation } from '../lib/i18n';
import toast from 'react-hot-toast';
import { BackupListSkeleton } from './Skeleton';

type BackupRestoreModalProps = {
  profile: Profile;
  onClose: () => void;
  onRestoreComplete: () => void;
};

export function BackupRestoreModal({ profile, onClose, onRestoreComplete }: BackupRestoreModalProps) {
  const [backups, setBackups] = useState<{
    id: string;
    created_at: string;
    backup_type: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [verifyingBiometrics, setVerifyingBiometrics] = useState(false);

  const { t, isRTL } = useTranslation(profile);

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const data = await getBackups(profile.id);
      setBackups(data);
    } catch (error) {
      toast.error(t('backup.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setCreating(true);
      const success = await createBackup(profile.id, 'manual');
      if (success) {
        toast.success(t('backup.create_success'));
        await loadBackups();
      } else {
        throw new Error('Backup failed');
      }
    } catch (error) {
      toast.error(t('backup.create_error'));
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;

    try {
      setVerifyingBiometrics(true);
      const verified = await verifyBiometrics(profile.id);
      if (!verified) {
        toast.error('Biometric verification required');
        return;
      }
      setVerifyingBiometrics(false);

      setRestoring(true);
      const success = await restoreFromBackup(profile.id, selectedBackup);
      if (success) {
        toast.success(t('backup.restore_success'));
        onRestoreComplete();
        onClose();
      } else {
        throw new Error('Restore failed');
      }
    } catch (error) {
      toast.error(t('backup.restore_error'));
    } finally {
      setVerifyingBiometrics(false);
      setRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'} onClick={onClose}>
      <div className="glass-modal w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up-mobile sm:animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700/60 shrink-0">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('backup.title')}</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="w-full mb-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98]"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t('backup.creating')}</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>{t('backup.create')}</span>
              </>
            )}
          </button>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('backup.available')}
            </h3>

            {loading ? (
              <BackupListSkeleton count={3} />
            ) : backups.length === 0 ? (
              <div className="text-center py-8">
                <Archive className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('backup.no_backups')}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[35vh] overflow-y-auto">
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    onClick={() => setSelectedBackup(backup.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedBackup === backup.id
                        ? 'bg-cyan-50 dark:bg-cyan-900/20 border-2 border-cyan-500 dark:border-cyan-400'
                        : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {backup.backup_type === 'auto' ? (
                        <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      ) : (
                        <Archive className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {backup.backup_type === 'auto' ? t('backup.auto') : t('backup.manual')}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {format(new Date(backup.created_at), 'PPpp')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedBackup && (
              <div className="mt-3 space-y-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    {t('backup.restore_warning')}
                  </p>
                </div>

                <button
                  onClick={handleRestore}
                  disabled={restoring || verifyingBiometrics}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98]"
                >
                  {verifyingBiometrics ? (
                    <>
                      <Fingerprint className="h-4 w-4 animate-pulse" />
                      <span>{t('biometrics.verifying')}</span>
                    </>
                  ) : restoring ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t('backup.restoring')}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>{t('backup.restore')}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
