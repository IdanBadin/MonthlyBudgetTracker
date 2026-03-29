import React, { useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { Profile } from '../types/database';
import { useTranslation } from '../lib/i18n';

type ThemeCustomizerProps = {
  profile: Profile;
  onColorChange: (colors: { primary: string; secondary: string }) => void;
};

const colorPalettes = [
  { primary: '#3B82F6', secondary: '#10B981', name: 'default' },
  { primary: '#8B5CF6', secondary: '#EC4899', name: 'purple_pink' },
  { primary: '#F59E0B', secondary: '#EF4444', name: 'amber_red' },
  { primary: '#06B6D4', secondary: '#6366F1', name: 'cyan_indigo' },
  { primary: '#14B8A6', secondary: '#F97316', name: 'teal_orange' },
  { primary: '#6366F1', secondary: '#8B5CF6', name: 'indigo_purple' },
  { primary: '#EC4899', secondary: '#F59E0B', name: 'pink_amber' },
  { primary: '#10B981', secondary: '#3B82F6', name: 'emerald_blue' }
];

export function ThemeCustomizer({ profile, onColorChange }: ThemeCustomizerProps) {
  const [selectedPalette, setSelectedPalette] = useState(() => {
    const userPreferences = profile.theme_colors || { primary: '#3B82F6', secondary: '#10B981' };
    return colorPalettes.find(
      p => p.primary === userPreferences.primary && p.secondary === userPreferences.secondary
    )?.name || 'default';
  });

  const { t } = useTranslation(profile);

  const handlePaletteChange = (palette: typeof colorPalettes[0]) => {
    setSelectedPalette(palette.name);
    onColorChange({
      primary: palette.primary,
      secondary: palette.secondary
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Palette className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('settings.theme_colors')}</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {colorPalettes.map((palette) => (
          <button
            key={palette.name}
            type="button"
            onClick={() => handlePaletteChange(palette)}
            className={`
              relative p-3 rounded-xl border-2 transition-all duration-200
              ${selectedPalette === palette.name
                ? 'border-cyan-500 dark:border-cyan-400 bg-cyan-50/50 dark:bg-cyan-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }
            `}
          >
            <div className="flex gap-1.5 justify-center">
              <div
                className="w-5 h-5 rounded-full ring-1 ring-black/5"
                style={{ backgroundColor: palette.primary }}
              />
              <div
                className="w-5 h-5 rounded-full ring-1 ring-black/5"
                style={{ backgroundColor: palette.secondary }}
              />
            </div>
            {selectedPalette === palette.name && (
              <div className="absolute top-1 right-1">
                <Check className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
