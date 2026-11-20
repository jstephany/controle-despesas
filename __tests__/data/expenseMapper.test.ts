import type { Expense } from '@/domain/entities/Expense';
import {
  mapExpenseToRow,
  mapRowToExpense,
  type ExpenseRow,
} from '@/data/mappers/expenseMapper';

describe('expenseMapper', () => {
  it('converte ExpenseRow (snake_case) para entidade Expense (camelCase)', () => {
    const row: ExpenseRow = {
      id: 'exp_123',
      description: 'Padaria',
      amount_cents: 1850,
      date: '2026-11-20',
      category: 'alimentacao',
      created_at: '2026-11-20T08:15:00.000Z',
    };

    expect(mapRowToExpense(row)).toEqual({
      id: 'exp_123',
      description: 'Padaria',
      amountCents: 1850,
      date: '2026-11-20',
      category: 'alimentacao',
      createdAt: '2026-11-20T08:15:00.000Z',
    });
  });

  it('usa categoria fallback "outros" caso o banco contenha categoria desconhecida', () => {
    const row: ExpenseRow = {
      id: 'exp_456',
      description: 'Item legado',
      amount_cents: 500,
      date: '2026-11-18',
      category: 'categoria_desconhecida',
      created_at: '2026-11-18T10:00:00.000Z',
    };

    expect(mapRowToExpense(row).category).toBe('outros');
  });

  it('converte entidade Expense para ExpenseRow sem perda de campos', () => {
    const expense: Expense = {
      id: 'exp_789',
      description: 'Transporte público',
      amountCents: 440,
      date: '2026-11-19',
      category: 'transporte',
      createdAt: '2026-11-19T07:30:00.000Z',
    };

    expect(mapExpenseToRow(expense)).toEqual({
      id: 'exp_789',
      description: 'Transporte público',
      amount_cents: 440,
      date: '2026-11-19',
      category: 'transporte',
      created_at: '2026-11-19T07:30:00.000Z',
    });
  });
});
