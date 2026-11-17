import { describe, expect, it, vi } from 'vitest';
import { entry } from '../domain/model';
import { upcomingExpenses } from '../domain/upcoming';

describe('upcoming expenses', () => {
  it('sorts individual occurrences by date and respects status and amount overrides', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-11-01T12:00:00Z'));
      const weekly = entry({ name: 'Viikoittainen', date: '2026-11-02', amount: 1000, recurrence: 'weekly', occurrenceStatuses: { '2026-11-09': 'skipped' }, occurrenceAmounts: { '2026-11-16': 1200 } });
      const once = entry({ name: 'Lasku', date: '2026-11-05', amount: 500 });
      const result = upcomingExpenses([weekly, once], '2026-11');
      expect(result.map(item => item.date)).toEqual(['2026-11-02', '2026-11-05', '2026-11-16', '2026-11-23', '2026-11-30']);
      expect(result.find(item => item.date === '2026-11-16')?.amount).toBe(1200);
      expect(result.reduce((sum, item) => sum + item.amount, 0)).toBe(4700);
    } finally { vi.useRealTimers(); }
  });
});
