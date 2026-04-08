import React, { useState, useEffect } from 'react';
import { X, Moon, Sun, Globe, DollarSign, Archive, Fingerprint, History } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';
import { Language, Currency, useTranslation } from '../lib/i18n';
import { BackupRestoreModal } from './BackupRestoreModal';
import { BiometricSetup } from './BiometricSetup';
import { ThemeCustomizer } from './ThemeCustomizer';
import toast from 'react-hot-toast';

type SettingsModalProps = {
  profile: Profile;
  onClose: () => void;
  onUpdate: () => void;
};

export function SettingsModal({ profile, onClose, onUpdate }: SettingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [formData, setFormData] = useState({
    name: profile.name || '',
    language: profile.language || 'en',
    currency: profile.currency || 'USD',
    theme: profile.theme || 'light',
    theme_colors: profile.theme_colors || { primary: '#3B82F6', secondary: '#10B981' },
    data_retention_months: profile.data_retention_months || 6
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
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', profile.id);

      if (error) throw error;

      document.documentElement.style.setProperty('--color-primary', formData.theme_colors.primary);
      document.documentElement.style.setProperty('--color-secondary', formData.theme_colors.secondary);

      toast.success(t('settings.updated'));
      onUpdate();
      onClose();
    } catch (error) {
      toast.error(t('settings.update_error'));
    } finally {
      setLoading(false);
    }
  };

  const settingRow = (icon: React.ReactNode, label: string, children: React.ReactNode) => (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">{label}</span>
      </div>
      {children}
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'} onClick={onClose}>
        <div className="glass-modal w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col animate-slide-up-mobile sm:animate-slide-in" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/8 shrink-0">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('settings.title')}</h2>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <form id="settings-form" onSubmit={handleSubmit} className="p-4 space-y-4">
              {settingRow(
                <Globe className="h-3.5 w-3.5 text-slate-400" />,
                t('settings.language'),
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value as Language })}
                  className="modern-input text-sm"
                >
                  <option value="he">עברית</option>
                </select>
              )}

              {settingRow(
                <DollarSign className="h-3.5 w-3.5 text-slate-400" />,
                t('settings.currency'),
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
                  className="modern-input text-sm"
                >
                  <option value="USD">USD ($)</option>
                  <option value="ILS">ILS (₪)</option>
                </select>
              )}

              {settingRow(
                formData.theme === 'dark'
                  ? <Moon className="h-3.5 w-3.5 text-slate-400" />
                  : <Sun className="h-3.5 w-3.5 text-slate-400" />,
                t('settings.theme'),
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    theme: formData.theme === 'dark' ? 'light' : 'dark'
                  })}
                  className="modern-input text-sm text-slate-700 dark:text-slate-300 text-left hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                >
                  {formData.theme === 'dark' ? t('settings.light_mode') : t('settings.dark_mode')}
                </button>
              )}

              <div className="pt-1">
                <ThemeCustomizer
                  profile={profile}
                  onColorChange={(colors) => setFormData({ ...formData, theme_colors: colors })}
                />
              </div>

              {settingRow(
                <History className="h-3.5 w-3.5 text-slate-400" />,
                t('settings.data_retention'),
                <>
                  <select
                    value={formData.data_retention_months}
                    onChange={(e) => setFormData({ ...formData, data_retention_months: parseInt(e.target.value) })}
                    className="modern-input text-sm"
                  >
                    <option value="3">{t('settings.three_months')}</option>
                    <option value="6">{t('settings.six_months')}</option>
                    <option value="12">{t('settings.twelve_months')}</option>
                  </select>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {t('settings.data_retention_info')}
                  </p>
                </>
              )}

              {settingRow(
                <Fingerprint className="h-3.5 w-3.5 text-slate-400" />,
                t('biometrics.title'),
                <button
                  type="button"
                  onClick={() => setShowBiometricSetup(true)}
                  className="modern-input text-sm text-slate-700 dark:text-slate-300 text-left hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                >
                  {t('biometrics.manage')}
                </button>
              )}

              {settingRow(
                <Archive className="h-3.5 w-3.5 text-slate-400" />,
                t('backup.manage'),
                <button
                  type="button"
                  onClick={() => setShowBackupModal(true)}
                  className="modern-input text-sm text-slate-700 dark:text-slate-300 text-left hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                >
                  {t('backup.open')}
                </button>
              )}
            </form>
          </div>

          <div className="shrink-0 p-4 border-t border-slate-100 dark:border-white/8">
            <button
              type="submit"
              form="settings-form"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-[#29695b] to-[#00342b] hover:from-[#004d40] hover:to-[#00342b] text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] shadow-md shadow-[#00342b]/25"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('settings.saving')}</span>
                </>
              ) : (
                t('settings.save')
              )}
            </button>
          </div>
        </div>
      </div>

      {showBackupModal && (
        <BackupRestoreModal
          profile={profile}
          onClose={() => setShowBackupModal(false)}
          onRestoreComplete={onUpdate}
        />
      )}

      {showBiometricSetup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] animate-fade-in" onClick={() => setShowBiometricSetup(false)}>
          <div className="glass-modal w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl animate-slide-up-mobile sm:animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/8">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('biometrics.title')}</h2>
              <button
                onClick={() => setShowBiometricSetup(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <BiometricSetup
              profile={profile}
              onClose={() => setShowBiometricSetup(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
