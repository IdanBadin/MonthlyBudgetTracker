import React, { useState, useEffect } from 'react';
import { Fingerprint, ShieldCheck, ShieldX, AlertTriangle, LogIn, Archive } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';
import { useTranslation } from '../lib/i18n';
import {
  isBiometricsAvailable,
  registerBiometrics,
  removeBiometrics,
  isBiometricsEnabled,
  updateBiometricSettings
} from '../lib/biometrics';
import toast from 'react-hot-toast';

type BiometricSetupProps = {
  profile: Profile;
  onClose: () => void;
};

export function BiometricSetup({ profile, onClose }: BiometricSetupProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [settings, setSettings] = useState({
    loginEnabled: false,
    backupEnabled: false
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { t } = useTranslation(profile);

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      const [available, enabled, currentSettings] = await Promise.all([
        isBiometricsAvailable(),
        isBiometricsEnabled(profile.id),
        supabase
          .from('user_preferences')
          .select('biometric_settings')
          .eq('user_id', profile.id)
          .single()
      ]);

      setIsAvailable(available);
      setIsEnabled(enabled);
      setSettings(currentSettings?.data?.biometric_settings || {
        loginEnabled: false,
        backupEnabled: false
      });
    } catch (error) {
      console.error('Error checking biometric status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    setProcessing(true);
    try {
      const success = await registerBiometrics(profile.id);
      if (success) {
        setIsEnabled(true);
        await updateBiometricSettings(profile.id, {
          loginEnabled: true,
          backupEnabled: true
        });
        setSettings({
          loginEnabled: true,
          backupEnabled: true
        });
        toast.success(t('biometrics.setup_success'));
      } else {
        throw new Error('Setup failed');
      }
    } catch (error) {
      toast.error(t('biometrics.setup_error'));
    } finally {
      setProcessing(false);
    }
  };

  const handleRemove = async () => {
    setProcessing(true);
    try {
      const success = await removeBiometrics(profile.id);
      if (success) {
        setIsEnabled(false);
        setSettings({
          loginEnabled: false,
          backupEnabled: false
        });
        toast.success(t('biometrics.removed'));
      } else {
        throw new Error('Removal failed');
      }
    } catch (error) {
      toast.error(t('biometrics.remove_error'));
    } finally {
      setProcessing(false);
    }
  };

  const toggleSetting = async (setting: 'loginEnabled' | 'backupEnabled') => {
    if (!isEnabled) return;

    try {
      const newSettings = {
        ...settings,
        [setting]: !settings[setting]
      };

      await updateBiometricSettings(profile.id, newSettings);
      setSettings(newSettings);
      toast.success(t('settings.updated'));
    } catch (error) {
      toast.error(t('settings.update_error'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-cyan-600/30 border-t-cyan-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start gap-3">
        {isAvailable ? (
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        ) : (
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">
            {isAvailable ? t('biometrics.available') : t('biometrics.unavailable')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isAvailable
              ? t('biometrics.available_desc')
              : t('biometrics.unavailable_desc')
            }
          </p>
        </div>
      </div>

      {isAvailable && (
        <div className="space-y-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {t('biometrics.status')}
                </span>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                isEnabled
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
              }`}>
                {isEnabled ? t('biometrics.enabled') : t('biometrics.disabled')}
              </span>
            </div>
          </div>

          {isEnabled && (
            <div className="space-y-2">
              <button
                onClick={() => toggleSetting('loginEnabled')}
                className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <LogIn className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {t('biometrics.login_auth')}
                  </span>
                </div>
                <div className={`w-10 h-5 rounded-full transition-colors relative ${
                  settings.loginEnabled ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    settings.loginEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </div>
              </button>

              <button
                onClick={() => toggleSetting('backupEnabled')}
                className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Archive className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {t('biometrics.backup_auth')}
                  </span>
                </div>
                <div className={`w-10 h-5 rounded-full transition-colors relative ${
                  settings.backupEnabled ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    settings.backupEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </div>
              </button>
            </div>
          )}

          <button
            onClick={isEnabled ? handleRemove : handleSetup}
            disabled={processing}
            className={`w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] ${
              isEnabled
                ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30'
                : 'bg-cyan-600 text-white hover:bg-cyan-700'
            }`}
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>
                  {isEnabled ? t('biometrics.removing') : t('biometrics.setting_up')}
                </span>
              </>
            ) : (
              <>
                {isEnabled ? (
                  <>
                    <ShieldX className="h-4 w-4" />
                    <span>{t('biometrics.remove')}</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-4 w-4" />
                    <span>{t('biometrics.setup')}</span>
                  </>
                )}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
