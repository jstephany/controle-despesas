import type { Expense } from '@/domain/entities/Expense';
import {
  calculateCategoryBreakdown,
  calculateMonthlySummary,
  calculateMonthlyTotal,
  filterExpensesByMonth,
  sortExpensesChronologically,
} from '@/domain/services/expenseCalculations';

const sampleExpenses: Expense[] = [
  {
    id: 'exp_1',
    description: 'Almoço',
    amountCents: 3590,
    date: '2026-11-10',
    category: 'alimentacao',
    createdAt: '2026-11-10T12:00:00.000Z',
  },
  {
    id: 'exp_2',
    description: 'Uber',
    amountCents: 2410,
    date: '2026-11-10',
    category: 'transporte',
    createdAt: '2026-11-10T18:30:00.000Z',
  },
  {
    id: 'exp_3',
    description: 'Mercado',
    amountCents: 19999,
    date: '2026-11-20',
    category: 'alimentacao',
    createdAt: '2026-11-20T09:00:00.000Z',
  },
  {
    id: 'exp_4',
    description: 'Aluguel Outubro',
    amountCents: 150000,
    date: '2026-10-31',
    category: 'moradia',
    createdAt: '2026-10-31T10:00:00.000Z',
  },
  {
    id: 'exp_5',
    description: 'Curso Dezembro',
    amountCents: 8900,
    date: '2026-12-01',
    category: 'educacao',
    createdAt: '2026-12-01T08:00:00.000Z',
  },
];

describe('expenseCalculations', () => {
  describe('calculateMonthlyTotal', () => {
    it('retorna zero para lista vazia', () => {
      expect(calculateMonthlyTotal([])).toBe(0);
    });

    it('soma valores em centavos com precisão exata sem erro de ponto flutuante', () => {
      const floatTrap: Expense[] = [
        { ...sampleExpenses[0], id: 'a', amountCents: 10 }, // R$ 0,10
        { ...sampleExpenses[0], id: 'b', amountCents: 20 }, // R$ 0,20
        { ...sampleExpenses[0], id: 'c', amountCents: 1999 }, // R$ 19,99
      ];
      expect(calculateMonthlyTotal(floatTrap)).toBe(2029);
    });
  });

  describe('filterExpensesByMonth', () => {
    it('filtra estritamente as despesas pertencentes ao mês e ano selecionados', () => {
      const nov = filterExpensesByMonth(sampleExpenses, { year: 2026, month: 11 });
      expect(nov.map((item) => item.id)).toEqual(['exp_1', 'exp_2', 'exp_3']);

      const oct = filterExpensesByMonth(sampleExpenses, { year: 2026, month: 10 });
      expect(oct.map((item) => item.id)).toEqual(['exp_4']);

      const jan = filterExpensesByMonth(sampleExpenses, { year: 2026, month: 1 });
      expect(jan).toEqual([]);
    });
  });

  describe('sortExpensesChronologically', () => {
    it('ordena da data mais recente para a mais antiga usando createdAt como desempate sem mutar entrada', () => {
      const originalOrder = sampleExpenses.map((e) => e.id);
      const sorted = sortExpensesChronologically(sampleExpenses);

      expect(sorted.map((e) => e.id)).toEqual(['exp_5', 'exp_3', 'exp_2', 'exp_1', 'exp_4']);
      expect(sampleExpenses.map((e) => e.id)).toEqual(originalOrder);
    });
  });

  describe('calculateMonthlySummary', () => {
    it('combina filtro mensal, ordenação cronológica, contagem e total exato', () => {
      const summary = calculateMonthlySummary(sampleExpenses, { year: 2026, month: 11 });

      expect(summary.period).toEqual({ year: 2026, month: 11 });
      expect(summary.count).toBe(3);
      expect(summary.totalCents).toBe(3590 + 2410 + 19999);
      expect(summary.expenses.map((e) => e.id)).toEqual(['exp_3', 'exp_2', 'exp_1']);
    });
  });

  describe('calculateCategoryBreakdown', () => {
    it('agrupa gastos por categoria mantendo todas as categorias com percentuais e razão sobre o máximo', () => {
      const novExpenses = filterExpensesByMonth(sampleExpenses, { year: 2026, month: 11 });
      const breakdown = calculateCategoryBreakdown(novExpenses);

      expect(breakdown).toHaveLength(7);

      const food = breakdown.find((item) => item.category === 'alimentacao');
      const transport = breakdown.find((item) => item.category === 'transporte');
      const health = breakdown.find((item) => item.category === 'saude');

      expect(food?.totalCents).toBe(3590 + 19999);
      expect(food?.ratioToMax).toBe(1);
      expect(food?.percentage).toBe(Math.round(((3590 + 19999) / (3590 + 2410 + 19999)) * 100));

      expect(transport?.totalCents).toBe(2410);
      expect(transport?.ratioToMax).toBeCloseTo(2410 / (3590 + 19999), 4);

      expect(health?.totalCents).toBe(0);
      expect(health?.percentage).toBe(0);
      expect(health?.ratioToMax).toBe(0);
    });

    it('retorna zeros para todas as categorias quando a lista está vazia', () => {
      const breakdown = calculateCategoryBreakdown([]);
      expect(breakdown).toHaveLength(7);
      expect(breakdown.every((item) => item.totalCents === 0 && item.ratioToMax === 0)).toBe(true);
    });
  });
});
