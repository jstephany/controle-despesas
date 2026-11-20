import type { Expense } from '@/domain/entities/Expense';
import { buildPeriodAnalyticsReport } from '@/domain/services/analyticsService';

const refDate = new Date(2026, 10, 20, 12, 0, 0); // 20/11/2026

const fixtureExpenses: Expense[] = [
  {
    id: 'e1',
    description: 'Mercado Nov',
    amountCents: 30000,
    date: '2026-11-15',
    category: 'alimentacao',
    createdAt: '2026-11-15T10:00:00.000Z',
  },
  {
    id: 'e2',
    description: 'Uber Nov',
    amountCents: 10000,
    date: '2026-11-10',
    category: 'transporte',
    createdAt: '2026-11-10T10:00:00.000Z',
  },
  {
    id: 'e3',
    description: 'Restaurante Out',
    amountCents: 20000,
    date: '2026-10-08',
    category: 'alimentacao',
    createdAt: '2026-10-08T10:00:00.000Z',
  },
  {
    id: 'e4',
    description: 'Aluguel Set',
    amountCents: 90000,
    date: '2026-09-05',
    category: 'moradia',
    createdAt: '2026-09-05T10:00:00.000Z',
  },
  {
    id: 'e5',
    description: 'Farmácia Jul',
    amountCents: 12000,
    date: '2026-07-12',
    category: 'saude',
    createdAt: '2026-07-12T10:00:00.000Z',
  },
  {
    id: 'e6',
    description: 'Curso Jan',
    amountCents: 50000,
    date: '2026-01-20',
    category: 'educacao',
    createdAt: '2026-01-20T10:00:00.000Z',
  },
  {
    id: 'e7',
    description: 'Viagem 2025',
    amountCents: 80000,
    date: '2025-12-10',
    category: 'lazer',
    createdAt: '2025-12-10T10:00:00.000Z',
  },
];

describe('analyticsService', () => {
  it('agrega corretamente os últimos 3 meses com média mensal e ranking decrescente de categorias', () => {
    const report = buildPeriodAnalyticsReport(
      fixtureExpenses,
      'last_3_months',
      null,
      refDate
    );

    expect(report.monthsCount).toBe(3);
    expect(report.monthlySeries.map((m) => m.monthKey)).toEqual([
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
    expect(report.monthlySeries.map((m) => m.totalCents)).toEqual([
      90000,
      20000,
      40000,
    ]);
    expect(report.totalCents).toBe(150000);
    expect(report.monthlyAverageCents).toBe(50000);
    expect(report.expenseCount).toBe(4);

    // Somente categorias > 0, ordenadas da maior para a menor
    expect(report.categoryRanking).toEqual([
      { category: 'moradia', totalCents: 90000, percentage: 60, count: 1 },
      { category: 'alimentacao', totalCents: 50000, percentage: 33, count: 2 },
      { category: 'transporte', totalCents: 10000, percentage: 7, count: 1 },
    ]);
  });

  it('aplica filtro combinado de período (últimos 6 meses) e categoria', () => {
    const report = buildPeriodAnalyticsReport(
      fixtureExpenses,
      'last_6_months',
      'alimentacao',
      refDate
    );

    expect(report.monthsCount).toBe(6);
    expect(report.monthlySeries.map((m) => m.monthKey)).toEqual([
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
    expect(report.totalCents).toBe(50000);
    expect(report.monthlyAverageCents).toBe(Math.round(50000 / 6));
    expect(report.expenseCount).toBe(2);
    expect(report.categoryRanking).toEqual([
      { category: 'alimentacao', totalCents: 50000, percentage: 100, count: 2 },
    ]);
  });

  it('calcula o preset "this_year" de janeiro até o mês de referência excluindo anos anteriores', () => {
    const report = buildPeriodAnalyticsReport(
      fixtureExpenses,
      'this_year',
      null,
      refDate
    );

    expect(report.monthsCount).toBe(11);
    expect(report.monthlySeries[0].monthKey).toBe('2026-01');
    expect(report.monthlySeries[10].monthKey).toBe('2026-11');
    expect(report.totalCents).toBe(30000 + 10000 + 20000 + 90000 + 12000 + 50000);
    expect(report.filteredExpenses.some((e) => e.id === 'e7')).toBe(false);
  });

  it('calcula o preset "all" abrangendo todos os meses distintos com lançamentos', () => {
    const report = buildPeriodAnalyticsReport(
      fixtureExpenses,
      'all',
      null,
      refDate
    );

    expect(report.monthsCount).toBe(6); // 2025-12, 2026-01, 2026-07, 2026-09, 2026-10, 2026-11
    expect(report.monthlySeries.map((m) => m.monthKey)).toEqual([
      '2025-12',
      '2026-01',
      '2026-07',
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
    expect(report.totalCents).toBe(292000);
    expect(report.monthlyAverageCents).toBe(Math.round(292000 / 6));
  });

  it('retorna zeros e ranking vazio quando não há despesas correspondentes', () => {
    const report = buildPeriodAnalyticsReport(
      [],
      'last_3_months',
      null,
      refDate
    );

    expect(report.totalCents).toBe(0);
    expect(report.monthlyAverageCents).toBe(0);
    expect(report.expenseCount).toBe(0);
    expect(report.categoryRanking).toEqual([]);
    expect(report.monthlySeries).toHaveLength(3);
  });
});
