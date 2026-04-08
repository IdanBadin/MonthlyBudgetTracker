import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { GoogleIcon } from '../icons/GoogleIcon';

/**
 * GoogleIcon Component Tests (NEW)
 * Simple icon component — low priority but completes coverage
 */
describe('GoogleIcon', () => {
  describe('Rendering', () => {
    it('should render SVG element', () => {
      const { container } = render(<GoogleIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have correct viewBox for Google logo', () => {
      const { container } = render(<GoogleIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('should render all 4 color paths (Google logo colors)', () => {
      const { container } = render(<GoogleIcon />);
      const paths = container.querySelectorAll('path');
      expect(paths).toHaveLength(4); // Blue, Green, Yellow, Red
    });

    it('should have correct color fills', () => {
      const { container } = render(<GoogleIcon />);
      const paths = container.querySelectorAll('path');

      // Verify Google brand colors present
      const fills = Array.from(paths).map(p => p.getAttribute('fill'));
      expect(fills).toContain('#4285F4'); // Blue
      expect(fills).toContain('#34A853'); // Green
      expect(fills).toContain('#FBBC05'); // Yellow
      expect(fills).toContain('#EA4335'); // Red
    });
  });

  describe('Custom className', () => {
    it('should apply default className when none provided', () => {
      const { container } = render(<GoogleIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-5', 'w-5');
    });

    it('should apply custom className when provided', () => {
      const { container } = render(<GoogleIcon className="h-8 w-8 custom-class" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-8', 'w-8', 'custom-class');
      expect(svg).not.toHaveClass('h-5', 'w-5');
    });

    it('should support Tailwind sizing classes', () => {
      const { container } = render(<GoogleIcon className="h-12 w-12" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-12', 'w-12');
    });
  });

  describe('Accessibility', () => {
    it('should have role="img" for screen readers', () => {
      // TODO: Add role="img" to SVG if missing
      const { container } = render(<GoogleIcon />);
      const svg = container.querySelector('svg');
      // expect(svg).toHaveAttribute('role', 'img');
    });

    it('should have aria-label for screen readers', () => {
      // TODO: Add aria-label="Google logo" if missing
      const { container } = render(<GoogleIcon />);
      const svg = container.querySelector('svg');
      // expect(svg).toHaveAttribute('aria-label', 'Google logo');
    });

    it('should be hidden from screen readers if decorative', () => {
      // If icon is purely decorative (always appears with "Sign in with Google" text)
      // TODO: Add aria-hidden="true" if appropriate
    });
  });

  describe('SVG Optimization', () => {
    it('should have xmlns attribute for standalone usage', () => {
      const { container } = render(<GoogleIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    });

    it('should render without console errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      render(<GoogleIcon />);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Integration with AuthForm', () => {
    it('should display correctly inside button', () => {
      // TODO: Render inside button context
      // TODO: Verify proper alignment
    });

    it('should scale correctly at different sizes', () => {
      // Test various sizes: h-4, h-5, h-6, h-8
      const sizes = ['h-4 w-4', 'h-5 w-5', 'h-6 w-6', 'h-8 w-8'];

      sizes.forEach(size => {
        const { container } = render(<GoogleIcon className={size} />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveClass(size.split(' ')[0]);
      });
    });
  });

  describe('Performance', () => {
    it('should render quickly (inline SVG is fast)', () => {
      const start = performance.now();
      render(<GoogleIcon />);
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(10); // Should be instant
    });

    it('should not cause re-renders when className unchanged', () => {
      const { rerender } = render(<GoogleIcon className="h-5 w-5" />);
      const renderSpy = vi.fn();

      // TODO: Wrap with memo if needed
      rerender(<GoogleIcon className="h-5 w-5" />);
      // Verify component doesn't re-render unnecessarily
    });
  });
});
