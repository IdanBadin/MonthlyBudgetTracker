import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MonthSelector } from '../MonthSelector';
import { Profile } from '../../types/database';

describe('MonthSelector Component', () => {
  const mockOnChange = vi.fn();
  const mockProfile: Profile = {
    id: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    language: 'en',
    currency: 'USD',
    theme: 'light',
    data_retention_months: 6,
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render 19 months (6 past + current + 12 future)', () => {
      const selectedMonth = new Date(2026, 2, 1); // March 2026
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );
      // TODO: Count month buttons
      // TODO: Verify 19 buttons rendered (Sept 2025 - Sept 2027)
    });

    it('should highlight selected month', () => {
      const selectedMonth = new Date(2026, 2, 15); // March 2026
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );
      // TODO: Find March 2026 button
      // TODO: Verify it has "month-button-selected" class
    });

    it('should highlight today\'s month when not selected', () => {
      vi.setSystemTime(new Date(2026, 2, 29)); // March 29, 2026
      const selectedMonth = new Date(2026, 1, 1); // Feb 2026
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );
      // TODO: Find March 2026 button
      // TODO: Verify it has "month-button-today" class
      // TODO: Verify Feb 2026 has "month-button-selected" class
    });

    it('should display full month name and year in header', () => {
      const selectedMonth = new Date(2026, 2, 1); // March 2026
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );
      // TODO: Verify header shows "March 2026"
    });

    it('should display short month names in buttons', () => {
      const selectedMonth = new Date(2026, 2, 1);
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );
      // TODO: Verify buttons show "Mar" not "March"
      // TODO: Verify buttons show "'26" year suffix
    });
  });

  describe('Month Navigation', () => {
    it('should change month when clicking prev arrow', () => {
      const selectedMonth = new Date(2026, 2, 1); // March 2026
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );
      // TODO: Click prev arrow (ChevronLeft)
      // TODO: Verify onChange called with February 2026
    });

    it('should change month when clicking next arrow', () => {
      const selectedMonth = new Date(2026, 2, 1);
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );
      // TODO: Click next arrow (ChevronRight)
      // TODO: Verify onChange called with April 2026
    });

    it('should disable prev arrow at minAllowedDate', () => {
      const minDate = new Date(2026, 0, 1); // Jan 2026
      const selectedMonth = new Date(2026, 0, 1);
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
          minAllowedDate={minDate}
        />
      );
      // TODO: Find prev arrow button
      // TODO: Verify it's disabled
      // TODO: Click should not call onChange
    });

    it('should allow next arrow navigation at maxDate', () => {
      // No maxDate constraint - should always allow next
      const selectedMonth = new Date(2026, 11, 1); // Dec 2026
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );
      // TODO: Click next arrow
      // TODO: Verify onChange called with Jan 2027
    });

    it('should jump to today when clicking Today button', () => {
      vi.setSystemTime(new Date(2026, 2, 29)); // March 29, 2026
      const selectedMonth = new Date(2025, 11, 1); // Dec 2025
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );
      // TODO: Click "Today" button
      // TODO: Verify onChange called with March 2026
    });

    it('should jump to minAllowedDate when Today is before minAllowedDate', () => {
      vi.setSystemTime(new Date(2025, 0, 1)); // Jan 2025
      const minDate = new Date(2026, 0, 1); // Jan 2026
      const selectedMonth = new Date(2026, 6, 1); // Jul 2026
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
          minAllowedDate={minDate}
        />
      );
      // TODO: Click "Today" button
      // TODO: Verify onChange called with Jan 2026 (minDate), not Jan 2025
    });

    it('should select month when clicking month button', () => {
      const selectedMonth = new Date(2026, 2, 1); // March 2026
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );
      // TODO: Click "May '26" button
      // TODO: Verify onChange called with May 2026
    });
  });

  describe('Scrolling Behavior', () => {
    it('should auto-scroll selected month into view on mount', async () => {
      const selectedMonth = new Date(2026, 6, 1); // July 2026 (far right)
      const { container } = render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );

      // TODO: Wait for scroll animation
      vi.runAllTimers();
      await waitFor(() => {
        // TODO: Verify scroll container has scrolled
        // TODO: Verify July button is centered in view
      });
    });

    it('should scroll to new selection when month changes', async () => {
      const { rerender } = render(
        <MonthSelector
          selectedMonth={new Date(2026, 0, 1)} // Jan 2026
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );

      vi.runAllTimers();

      rerender(
        <MonthSelector
          selectedMonth={new Date(2026, 11, 1)} // Dec 2026
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );

      // TODO: Verify scroll position updates
      vi.runAllTimers();
    });

    it('should handle ResizeObserver for scroll positioning', async () => {
      const selectedMonth = new Date(2026, 2, 1);
      const { container } = render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );

      // TODO: Trigger resize event
      // TODO: Verify scroll recalculates
      // TODO: Verify selected month remains centered
    });

    it('should cleanup ResizeObserver on unmount', () => {
      const selectedMonth = new Date(2026, 2, 1);
      const { unmount } = render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );

      // TODO: Spy on ResizeObserver.disconnect
      unmount();
      // TODO: Verify disconnect called
    });

    it('should cleanup timers on unmount', () => {
      const selectedMonth = new Date(2026, 2, 1);
      const { unmount } = render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );

      // TODO: Track active timers
      unmount();
      // TODO: Verify all timers cleared
    });
  });

  describe('minAllowedDate Constraint', () => {
    it('should filter out months before minAllowedDate', () => {
      const minDate = new Date(2026, 0, 1); // Jan 2026
      const selectedMonth = new Date(2026, 2, 1);
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
          minAllowedDate={minDate}
        />
      );
      // TODO: Verify months before Jan 2026 don't appear
      // TODO: Count visible buttons - should be fewer than 19
    });

    it('should default to 6 months ago when no minAllowedDate', () => {
      vi.setSystemTime(new Date(2026, 5, 15)); // June 15, 2026
      const selectedMonth = new Date(2026, 5, 1);
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );
      // TODO: Verify earliest month is Dec 2025 (6 months ago)
    });

    it('should handle minAllowedDate in the future', () => {
      vi.setSystemTime(new Date(2026, 0, 1)); // Jan 2026
      const minDate = new Date(2026, 6, 1); // July 2026 (future)
      const selectedMonth = new Date(2026, 6, 1);
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
          minAllowedDate={minDate}
        />
      );
      // TODO: Verify only months from July 2026 onwards appear
    });
  });

  describe('RTL Support', () => {
    it('should reverse arrow directions in RTL mode', () => {
      const hebrewProfile = { ...mockProfile, language: 'he' as const };
      const selectedMonth = new Date(2026, 2, 1);
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={hebrewProfile}
        />
      );
      // TODO: Find left arrow button
      // TODO: Verify it renders ChevronRight icon (reversed)
      // TODO: Find right arrow button
      // TODO: Verify it renders ChevronLeft icon (reversed)
      // TODO: Verify clicking works correctly despite reversal
    });

    it('should apply RTL layout to container', () => {
      const hebrewProfile = { ...mockProfile, language: 'he' as const };
      const selectedMonth = new Date(2026, 2, 1);
      const { container } = render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={hebrewProfile}
        />
      );
      // TODO: Verify container has dir="rtl"
    });
  });

  describe('Internationalization', () => {
    it('should translate month names', () => {
      const selectedMonth = new Date(2026, 2, 1); // March
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );
      // TODO: Verify header shows "March" in English

      const hebrewProfile = { ...mockProfile, language: 'he' as const };
      const { rerender } = render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={hebrewProfile}
        />
      );
      // TODO: Verify header shows Hebrew translation
    });

    it('should translate "Today" button', () => {
      const selectedMonth = new Date(2026, 2, 1);
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );
      // TODO: Verify button shows "Today" in English

      const hebrewProfile = { ...mockProfile, language: 'he' as const };
      const { rerender } = render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={hebrewProfile}
        />
      );
      // TODO: Verify button shows Hebrew translation
    });

    it('should shorten long month names correctly', () => {
      // TODO: Test with language that has long month names
      // TODO: Verify names longer than 5 chars are truncated to 3
      // TODO: Verify short names remain unchanged
    });
  });

  describe('Edge Cases', () => {
    it('should handle month at year boundary (Dec to Jan)', () => {
      const selectedMonth = new Date(2025, 11, 1); // Dec 2025
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );
      // TODO: Click next arrow
      // TODO: Verify onChange called with Jan 2026
      // TODO: Verify year updates in display
    });

    it('should handle selectedMonth prop changes externally', async () => {
      const { rerender } = render(
        <MonthSelector
          selectedMonth={new Date(2026, 0, 1)}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );

      vi.runAllTimers();

      rerender(
        <MonthSelector
          selectedMonth={new Date(2026, 6, 1)}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );

      // TODO: Verify UI updates to new selection
      // TODO: Verify scroll repositions
    });

    it('should work without profile prop', () => {
      const selectedMonth = new Date(2026, 2, 1);
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
        />
      );
      // TODO: Verify component renders with defaults
    });

    it('should handle rapid month selections', async () => {
      const selectedMonth = new Date(2026, 2, 1);
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );
      // TODO: Click 5 different months rapidly
      // TODO: Verify onChange called 5 times
      // TODO: Verify no race conditions in scroll positioning
    });

    it('should handle leap year February', () => {
      const selectedMonth = new Date(2024, 1, 1); // Feb 2024 (leap year)
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );
      // TODO: Verify renders correctly
      // TODO: Navigation works as expected
    });
  });

  describe('Accessibility', () => {
    it('should allow keyboard navigation through months', () => {
      const selectedMonth = new Date(2026, 2, 1);
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );
      // TODO: Tab to prev arrow, press Enter
      // TODO: Tab to month buttons, press Enter
      // TODO: Tab to next arrow, press Enter
      // TODO: Verify all interactions work
    });

    it('should have accessible button labels', () => {
      const selectedMonth = new Date(2026, 2, 1);
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );
      // TODO: Verify arrow buttons have aria-label
      // TODO: Verify Today button has descriptive text
      // TODO: Verify month buttons have accessible names
    });

    it('should announce month changes to screen readers', () => {
      const selectedMonth = new Date(2026, 2, 1);
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
        />
      );
      // TODO: Click month button
      // TODO: Verify aria-live region announces change
    });

    it('should indicate disabled state on prev arrow', () => {
      const minDate = new Date(2026, 0, 1);
      const selectedMonth = new Date(2026, 0, 1);
      render(
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={mockOnChange}
          profile={mockProfile}
          minAllowedDate={minDate}
        />
      );
      // TODO: Verify prev arrow has disabled attribute
      // TODO: Verify aria-disabled="true"
    });
  });
});
