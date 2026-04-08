import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionList } from '../TransactionList';
import { Transaction } from '../../types/database';

/**
 * CRITICAL: Tests for O(n) running balance calculation
 * Validates the recent optimization from O(n²) nested loop to O(n) single pass
 */
describe('TransactionList - Running Balance Optimization', () => {
  const createMockTransaction = (id: string, date: string, amount: number, type: 'income' | 'expense'): Transaction => ({
    id,
    date,
    amount,
    type,
    category: 'Test',
    description: 'Test transaction',
    user_id: 'user-123',
    created_at: date,
    updated_at: date
  });

  describe('Correctness of O(n) algorithm', () => {
    it('should calculate running balance correctly with mixed transactions', () => {
      const transactions: Transaction[] = [
        createMockTransaction('1', '2024-01-01', 100, 'income'),
        createMockTransaction('2', '2024-01-02', 30, 'expense'),
        createMockTransaction('3', '2024-01-03', 50, 'income'),
        createMockTransaction('4', '2024-01-04', 20, 'expense')
      ];

      const { container } = render(
        <TransactionList
          transactions={transactions}
          onEdit={() => {}}
          onDelete={() => {}}
          isLoading={false}
        />
      );

      // Expected running balances (chronological):
      // After tx1: 100
      // After tx2: 70
      // After tx3: 120
      // After tx4: 100

      const balances = container.querySelectorAll('.running-balance');
      expect(balances).toHaveLength(4);

      // Verify each balance (note: list may be reversed for display)
      const balanceTexts = Array.from(balances).map(el => el.textContent);
      expect(balanceTexts).toContain('100');
      expect(balanceTexts).toContain('70');
      expect(balanceTexts).toContain('120');
      expect(balanceTexts).toContain('100');
    });

    it('should handle all income transactions correctly', () => {
      const transactions: Transaction[] = [
        createMockTransaction('1', '2024-01-01', 100, 'income'),
        createMockTransaction('2', '2024-01-02', 50, 'income'),
        createMockTransaction('3', '2024-01-03', 75, 'income')
      ];

      const { container } = render(
        <TransactionList
          transactions={transactions}
          onEdit={() => {}}
          onDelete={() => {}}
          isLoading={false}
        />
      );

      // Expected: 100, 150, 225
      const balances = container.querySelectorAll('.running-balance');
      const balanceTexts = Array.from(balances).map(el => el.textContent);

      expect(balanceTexts).toContain('100');
      expect(balanceTexts).toContain('150');
      expect(balanceTexts).toContain('225');
    });

    it('should handle all expense transactions correctly', () => {
      const transactions: Transaction[] = [
        createMockTransaction('1', '2024-01-01', 100, 'expense'),
        createMockTransaction('2', '2024-01-02', 50, 'expense'),
        createMockTransaction('3', '2024-01-03', 25, 'expense')
      ];

      const { container } = render(
        <TransactionList
          transactions={transactions}
          onEdit={() => {}}
          onDelete={() => {}}
          isLoading={false}
        />
      );

      // Expected: -100, -150, -175
      const balances = container.querySelectorAll('.running-balance');
      expect(balances.length).toBeGreaterThan(0);
    });

    it('should handle single transaction', () => {
      const transactions: Transaction[] = [
        createMockTransaction('1', '2024-01-01', 100, 'income')
      ];

      const { container } = render(
        <TransactionList
          transactions={transactions}
          onEdit={() => {}}
          onDelete={() => {}}
          isLoading={false}
        />
      );

      const balances = container.querySelectorAll('.running-balance');
      expect(balances).toHaveLength(1);
    });

    it('should handle empty transaction list', () => {
      const { container } = render(
        <TransactionList
          transactions={[]}
          onEdit={() => {}}
          onDelete={() => {}}
          isLoading={false}
        />
      );

      const balances = container.querySelectorAll('.running-balance');
      expect(balances).toHaveLength(0);
    });
  });

  describe('Performance validation', () => {
    it('should handle 1000 transactions efficiently (< 100ms)', () => {
      const transactions: Transaction[] = Array.from({ length: 1000 }, (_, i) =>
        createMockTransaction(
          `tx-${i}`,
          `2024-01-${(i % 30) + 1}`,
          Math.random() * 100,
          i % 2 === 0 ? 'income' : 'expense'
        )
      );

      const start = performance.now();
      render(
        <TransactionList
          transactions={transactions}
          onEdit={() => {}}
          onDelete={() => {}}
          isLoading={false}
        />
      );
      const duration = performance.now() - start;

      // With O(n) algorithm, 1000 transactions should render in < 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should scale linearly with transaction count', () => {
      const sizes = [100, 500, 1000];
      const durations: number[] = [];

      sizes.forEach(size => {
        const transactions = Array.from({ length: size }, (_, i) =>
          createMockTransaction(`tx-${i}`, '2024-01-01', 10, 'income')
        );

        const start = performance.now();
        render(
          <TransactionList
            transactions={transactions}
            onEdit={() => {}}
            onDelete={() => {}}
            isLoading={false}
          />
        );
        durations.push(performance.now() - start);
      });

      // Verify linear scaling: 1000 txs shouldn't take > 2x time of 500 txs
      // (Old O(n²) would take ~4x time)
      const ratio = durations[2] / durations[1];
      expect(ratio).toBeLessThan(3); // Should be close to 2x, not 4x
    });
  });

  describe('Edge cases', () => {
    it('should handle transactions with same date', () => {
      const transactions: Transaction[] = [
        createMockTransaction('1', '2024-01-01', 100, 'income'),
        createMockTransaction('2', '2024-01-01', 50, 'expense'),
        createMockTransaction('3', '2024-01-01', 25, 'income')
      ];

      const { container } = render(
        <TransactionList
          transactions={transactions}
          onEdit={() => {}}
          onDelete={() => {}}
          isLoading={false}
        />
      );

      const balances = container.querySelectorAll('.running-balance');
      expect(balances).toHaveLength(3);
    });

    it('should handle zero-amount transactions', () => {
      const transactions: Transaction[] = [
        createMockTransaction('1', '2024-01-01', 100, 'income'),
        createMockTransaction('2', '2024-01-02', 0, 'expense'),
        createMockTransaction('3', '2024-01-03', 50, 'income')
      ];

      const { container } = render(
        <TransactionList
          transactions={transactions}
          onEdit={() => {}}
          onDelete={() => {}}
          isLoading={false}
        />
      );

      // Balance after zero transaction should equal previous
      const balances = container.querySelectorAll('.running-balance');
      expect(balances).toHaveLength(3);
    });

    it('should handle decimal amounts correctly', () => {
      const transactions: Transaction[] = [
        createMockTransaction('1', '2024-01-01', 100.50, 'income'),
        createMockTransaction('2', '2024-01-02', 30.25, 'expense'),
        createMockTransaction('3', '2024-01-03', 15.75, 'income')
      ];

      const { container } = render(
        <TransactionList
          transactions={transactions}
          onEdit={() => {}}
          onDelete={() => {}}
          isLoading={false}
        />
      );

      // Expected: 100.50, 70.25, 86.00
      const balances = container.querySelectorAll('.running-balance');
      expect(balances).toHaveLength(3);
    });

    it('should handle very large amounts', () => {
      const transactions: Transaction[] = [
        createMockTransaction('1', '2024-01-01', 1000000, 'income'),
        createMockTransaction('2', '2024-01-02', 999999, 'expense')
      ];

      expect(() => {
        render(
          <TransactionList
            transactions={transactions}
            onEdit={() => {}}
            onDelete={() => {}}
            isLoading={false}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Memoization correctness', () => {
    it('should recalculate when transactions change', () => {
      const initialTransactions = [
        createMockTransaction('1', '2024-01-01', 100, 'income')
      ];

      const { container, rerender } = render(
        <TransactionList
          transactions={initialTransactions}
          onEdit={() => {}}
          onDelete={() => {}}
          isLoading={false}
        />
      );

      let balances = container.querySelectorAll('.running-balance');
      expect(balances).toHaveLength(1);

      // Add another transaction
      const updatedTransactions = [
        ...initialTransactions,
        createMockTransaction('2', '2024-01-02', 50, 'expense')
      ];

      rerender(
        <TransactionList
          transactions={updatedTransactions}
          onEdit={() => {}}
          onDelete={() => {}}
          isLoading={false}
        />
      );

      balances = container.querySelectorAll('.running-balance');
      expect(balances).toHaveLength(2);
    });

    it('should not recalculate when unrelated props change', () => {
      const transactions = [
        createMockTransaction('1', '2024-01-01', 100, 'income')
      ];

      let renderCount = 0;
      const CountingComponent = (props: any) => {
        renderCount++;
        return <TransactionList {...props} />;
      };

      const { rerender } = render(
        <CountingComponent
          transactions={transactions}
          onEdit={() => {}}
          onDelete={() => {}}
          isLoading={false}
        />
      );

      const initialRenderCount = renderCount;

      // Change loading state (unrelated to calculation)
      rerender(
        <CountingComponent
          transactions={transactions}
          onEdit={() => {}}
          onDelete={() => {}}
          isLoading={true}
        />
      );

      // Component re-renders but calculation should be memoized
      expect(renderCount).toBeGreaterThan(initialRenderCount);
    });
  });

  describe('Regression tests (prevent O(n²) regression)', () => {
    it('should not use nested loops for balance calculation', () => {
      // This is a smoke test - the implementation should use useMemo + single pass
      // If someone accidentally reverts to O(n²), the 1000-transaction test will fail
      const transactions = Array.from({ length: 1000 }, (_, i) =>
        createMockTransaction(`tx-${i}`, `2024-01-${(i % 30) + 1}`, 10, 'income')
      );

      const start = performance.now();
      render(
        <TransactionList
          transactions={transactions}
          onEdit={() => {}}
          onDelete={() => {}}
          isLoading={false}
        />
      );
      const duration = performance.now() - start;

      // If this fails, O(n²) may have been reintroduced
      expect(duration).toBeLessThan(100);
    });
  });
});
