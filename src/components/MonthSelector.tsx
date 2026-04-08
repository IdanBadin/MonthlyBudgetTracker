import React, { useRef, useEffect } from 'react';
import { format, addMonths, subMonths, isSameMonth, isBefore } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Profile } from '../types/database';
import { useTranslation } from '../lib/i18n';

type MonthSelectorProps = {
  selectedMonth: Date;
  onChange: (date: Date) => void;
  profile?: Profile | null;
  minAllowedDate?: Date;
};

export function MonthSelector({ selectedMonth, onChange, profile, minAllowedDate }: MonthSelectorProps) {
  const { t, isRTL } = useTranslation(profile);
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedButtonRef = useRef<HTMLButtonElement>(null);

  const earliestAllowedMonth = minAllowedDate
    ? new Date(minAllowedDate.getFullYear(), minAllowedDate.getMonth(), 1)
    : subMonths(new Date(), 6);

  const months = Array.from({ length: 19 }, (_, i) => {
    const date = addMonths(new Date(), i - 6);
    if (isBefore(date, earliestAllowedMonth)) {
      return null;
    }
    return date;
  }).filter((date): date is Date => date !== null);

  const formatMonth = (date: Date) => {
    const monthNumber = parseInt(format(date, 'M'));
    const monthKeys = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    return t(`months.${monthKeys[monthNumber - 1]}`);
  };

  const formatMonthShort = (date: Date) => {
    const full = formatMonth(date);
    return full.length > 5 ? full.slice(0, 3) : full;
  };

  const scrollToSelected = () => {
    if (selectedButtonRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const button = selectedButtonRef.current;
      const containerWidth = container.offsetWidth;
      const buttonLeft = button.offsetLeft;
      const buttonWidth = button.offsetWidth;
      const targetScroll = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
      container.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!scrollRef.current || !selectedButtonRef.current) return;
    const container = scrollRef.current;
    const button = selectedButtonRef.current;
    const observer = new ResizeObserver(() => {
      if (button.offsetWidth > 0 && container.offsetWidth > 0) {
        scrollToSelected();
      }
    });
    observer.observe(container);
    observer.observe(button);
    const timers = [100, 300, 600].map(delay => setTimeout(scrollToSelected, delay));
    return () => {
      observer.disconnect();
      timers.forEach(timer => clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(scrollToSelected, 100);
    return () => clearTimeout(timer);
  }, [selectedMonth]);

  const handleTodayClick = () => {
    const today = new Date();
    const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    if (isBefore(todayMonth, earliestAllowedMonth)) {
      onChange(earliestAllowedMonth);
    } else {
      onChange(todayMonth);
    }
  };

  const handlePrevMonth = () => {
    const prevMonth = subMonths(selectedMonth, 1);
    if (!isBefore(prevMonth, earliestAllowedMonth)) {
      onChange(prevMonth);
    }
  };

  const handleNextMonth = () => {
    onChange(addMonths(selectedMonth, 1));
  };

  const PrevArrow = isRTL ? ChevronRight : ChevronLeft;
  const NextArrow = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="modern-card p-3 mb-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={handlePrevMonth}
          className="p-1.5 rounded-lg hover:bg-[#f2f4f5] dark:hover:bg-white/5 text-[#3f4945] dark:text-zinc-400 hover:text-[#00342b] transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={isBefore(subMonths(selectedMonth, 1), earliestAllowedMonth)}
        >
          <PrevArrow className="h-4 w-4" />
        </button>

        <div className="flex-1 text-center">
          <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
            {formatMonth(selectedMonth)} {format(selectedMonth, 'yyyy')}
          </span>
        </div>

        <button
          onClick={handleTodayClick}
          className="px-2.5 py-1 text-xs font-medium bg-[#f2f4f5] dark:bg-[#94d3c1]/10 text-[#00342b] dark:text-[#94d3c1] rounded-lg hover:bg-[#eceeef] dark:hover:bg-[#94d3c1]/20 transition-all duration-200 active:scale-95"
        >
          {t('common.today')}
        </button>

        <button
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg hover:bg-[#f2f4f5] dark:hover:bg-white/5 text-[#3f4945] dark:text-zinc-400 hover:text-[#00342b] transition-all duration-200 cursor-pointer"
        >
          <NextArrow className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex items-center overflow-x-auto hide-scrollbar gap-1.5 pb-1"
      >
        {months.map((date) => {
          const isSelected = format(date, 'yyyy-MM') === format(selectedMonth, 'yyyy-MM');
          const isToday = !isSelected && isSameMonth(date, new Date());

          return (
            <button
              key={date.toISOString()}
              ref={isSelected ? selectedButtonRef : null}
              onClick={() => onChange(date)}
              className={`
                flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 active:scale-95
                ${isSelected
                  ? 'month-button-selected'
                  : isToday
                    ? 'month-button-today'
                    : 'month-button-default'
                }
              `}
            >
              <span>{formatMonthShort(date)}</span>
              <span className="ml-1 opacity-60">{format(date, 'yy')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
