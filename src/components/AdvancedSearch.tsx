import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, Save } from 'lucide-react';
import { Profile } from '../types/database';
import { useTranslation } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import { DatePicker } from './DatePicker';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

type SearchFilters = {
  searchTerm: string;
  type: string;
  category: string;
  minAmount: string;
  maxAmount: string;
  startDate: string;
  endDate: string;
};

type SavedFilter = {
  id: string;
  name: string;
  filters: SearchFilters;
};

type AdvancedSearchProps = {
  profile?: Profile | null;
  onSearch: (filters: SearchFilters) => void;
  minAllowedDate?: Date;
};

const CATEGORIES = [
  'salary', 'freelance', 'investments', 'bit_transfer', 'food', 'rent',
  'utilities', 'groceries', 'transportation', 'entertainment', 'travel',
  'shopping', 'other'
];

const DEFAULT_FILTERS: SearchFilters = {
  searchTerm: '',
  type: '',
  category: '',
  minAmount: '',
  maxAmount: '',
  startDate: '',
  endDate: '',
};

export function AdvancedSearch({ profile, onSearch, minAllowedDate }: AdvancedSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [filterName, setFilterName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const { t, isRTL } = useTranslation(profile);

  useEffect(() => {
    loadSavedFilters();
  }, []);

  const loadSavedFilters = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('saved_filters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) {
        setSavedFilters(data.map(f => ({
          id: f.id,
          name: f.name,
          filters: f.filter_data as SearchFilters
        })));
      }
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, searchTerm: value };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    let validatedValue = value;
    if (key === 'startDate' && minAllowedDate) {
      const minDateStr = format(minAllowedDate, 'yyyy-MM-dd');
      if (value && value < minDateStr) {
        validatedValue = minDateStr;
      }
    }
    const newFilters = { ...filters, [key]: validatedValue };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    onSearch(DEFAULT_FILTERS);
  };

  const handleSaveFilter = async () => {
    if (!filterName.trim()) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from('saved_filters')
        .insert([{ user_id: user.id, name: filterName, filter_data: filters }]);
      if (error) throw error;
      toast.success(t('search.filter_saved'));
      setFilterName('');
      setShowSaveInput(false);
      loadSavedFilters();
    } catch (error) {
      toast.error(t('search.save_error'));
    }
  };

  const handleLoadFilter = (savedFilter: SavedFilter) => {
    let validatedFilters = { ...savedFilter.filters };
    if (minAllowedDate && validatedFilters.startDate) {
      const minDateStr = format(minAllowedDate, 'yyyy-MM-dd');
      if (validatedFilters.startDate < minDateStr) {
        validatedFilters.startDate = minDateStr;
      }
    }
    setFilters(validatedFilters);
    onSearch(validatedFilters);
  };

  const handleDeleteFilter = async (id: string) => {
    try {
      const { error } = await supabase.from('saved_filters').delete().eq('id', id);
      if (error) throw error;
      loadSavedFilters();
    } catch (error) {
      toast.error('Failed to delete filter');
    }
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');
  const minDateStr = minAllowedDate ? format(minAllowedDate, 'yyyy-MM-dd') : undefined;

  return (
    <div className="modern-card p-3 mb-1" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400`} />
          <input
            type="text"
            value={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={`modern-input ${isRTL ? 'pr-9' : 'pl-10'}`}
            placeholder={t('search.placeholder')}
          />
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
            isExpanded || hasActiveFilters
              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400'
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-white/8 pt-3 mt-3 space-y-3 animate-fade-in">
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-zinc-800/60 rounded-lg">
            {['', 'income', 'expense'].map((type) => (
              <button
                key={type}
                onClick={() => handleFilterChange('type', type)}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer ${
                  filters.type === type
                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-indigo-500'
                }`}
              >
                {type === '' ? t('search.all') : t(`transaction.${type}`)}
              </button>
            ))}
          </div>

          <div className="relative">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="modern-input text-xs"
            >
              <option value="">{t('search.all_categories')}</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{t(`categories.${cat}`)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              className="modern-input text-xs"
              placeholder={t('search.min_amount')}
            />
            <input
              type="number"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              className="modern-input text-xs"
              placeholder={t('search.max_amount')}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <DatePicker
              value={filters.startDate}
              onChange={(v) => handleFilterChange('startDate', v)}
              placeholder={t('search.start_date')}
              profile={profile}
              isStartDate={true}
              minDate={minDateStr}
            />
            <DatePicker
              value={filters.endDate}
              onChange={(v) => handleFilterChange('endDate', v)}
              placeholder={t('search.end_date')}
              profile={profile}
              minDate={minDateStr}
            />
          </div>

          <div className="flex items-center gap-2">
            {showSaveInput ? (
              <div className="flex-1 flex gap-1.5">
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="modern-input text-xs flex-1"
                  placeholder={t('search.filter_name')}
                />
                <button onClick={handleSaveFilter} className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg text-xs font-medium shadow-sm cursor-pointer">
                  {t('settings.save')}
                </button>
                <button onClick={() => setShowSaveInput(false)} className="px-2 py-1.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-lg text-xs cursor-pointer">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => setShowSaveInput(true)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-lg text-xs font-medium hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 cursor-pointer">
                  <Save className="h-3 w-3" />
                  <span>{t('search.save_filter')}</span>
                </button>
                {hasActiveFilters && (
                  <button onClick={handleReset} className="text-indigo-500 hover:text-indigo-600 text-xs font-medium cursor-pointer px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all duration-200">
                    {t('search.reset')}
                  </button>
                )}
              </>
            )}
          </div>

          {savedFilters.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {savedFilters.map((sf) => (
                <div key={sf.id} className="flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-medium">
                  <button onClick={() => handleLoadFilter(sf)} className="cursor-pointer">{sf.name}</button>
                  <button onClick={() => handleDeleteFilter(sf.id)} className="text-indigo-400 hover:text-rose-500 transition-colors cursor-pointer">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
