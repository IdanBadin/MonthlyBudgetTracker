import React, { useState, useRef, useEffect } from 'react';
import { format, isValid, parse } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { Profile } from '../types/database';

type DatePickerProps = {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  profile?: Profile | null;
  isStartDate?: boolean;
  minDate?: string;
  maxDate?: string;
};

export function DatePicker({
  value,
  onChange,
  placeholder,
  profile,
  minDate,
  maxDate
}: DatePickerProps) {
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t, isRTL } = useTranslation(profile);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;

    if (!newDate) {
      setInputValue('');
      onChange('');
      return;
    }

    const dateObj = parse(newDate, 'yyyy-MM-dd', new Date());

    if (isValid(dateObj)) {
      if (minDate && newDate < minDate) {
        setInputValue(minDate);
        onChange(minDate);
        return;
      }

      if (maxDate && newDate > maxDate) {
        setInputValue(maxDate);
        onChange(maxDate);
        return;
      }

      setInputValue(newDate);
      onChange(newDate);
    }
  };

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      <div className="relative overflow-hidden">
        <CalendarIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none z-10`} />
        <input
          type="date"
          value={inputValue}
          min={minDate}
          max={maxDate}
          onChange={handleDateChange}
          className={`
            modern-input text-center cursor-pointer
            ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}
          `}
          style={{
            colorScheme: 'dark',
            color: 'transparent',
          }}
        />
        <div
          className={`
            absolute inset-0
            flex items-center justify-center
            text-sm text-slate-700 dark:text-slate-300
            pointer-events-none
            ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}
            overflow-hidden
            truncate
          `}
        >
          {inputValue ? format(new Date(inputValue), 'dd/MM/yyyy') : placeholder || t('search.select_date')}
        </div>
      </div>
    </div>
  );
}
