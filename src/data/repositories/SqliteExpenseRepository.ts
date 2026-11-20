import { isValidCategory } from '@/domain/entities/Category';
import type {
  CreateExpenseInput,
  Expense,
  MonthPeriod,
} from '@/domain/entities/Expense';
import type { IExpenseRepository } from '@/domain/repositories/ExpenseRepository';
import { getMonthDateRange, isValidIsoDate } from '@/domain/utils/dateUtils';
import { generateExpenseId } from '@/domain/utils/idGenerator';

import type { SQLiteExecutor } from '../database/types';
import { mapRowToExpense, type ExpenseRow } from '../mappers/expenseMapper';

const INSERT_EXPENSE_SQL = `
  INSERT INTO expenses (id, description, amount_cents, date, category, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`;

const SELECT_EXPENSES_BY_MONTH_SQL = `
  SELECT id, description, amount_cents, date, category, created_at
  FROM expenses
  WHERE date >= ? AND date < ?
  ORDER BY date DESC, created_at DESC, id DESC
`;

const DELETE_EXPENSE_BY_ID_SQL = `
  DELETE FROM expenses
  WHERE id = ?
`;

export class SqliteExpenseRepository implements IExpenseRepository {
  constructor(private readonly db: SQLiteExecutor) {}

  async create(input: CreateExpenseInput): Promise<Expense> {
    const normalizedDescription = input.description.trim();

    if (!normalizedDescription) {
      throw new Error('Descrição da despesa não pode ser vazia.');
    }
    if (!Number.isSafeInteger(input.amountCents) || input.amountCents <= 0) {
      throw new Error('Valor da despesa deve ser um inteiro positivo em centavos.');
    }
    if (!isValidIsoDate(input.date)) {
      throw new Error('Data da despesa deve estar em formato ISO válido (YYYY-MM-DD).');
    }
    if (!isValidCategory(input.category)) {
      throw new Error('Categoria da despesa inválida.');
    }

    const expense: Expense = {
      id: generateExpenseId(),
      description: normalizedDescription,
      amountCents: input.amountCents,
      date: input.date,
      category: input.category,
      createdAt: new Date().toISOString(),
    };

    await this.db.runAsync(INSERT_EXPENSE_SQL, [
      expense.id,
      expense.description,
      expense.amountCents,
      expense.date,
      expense.category,
      expense.createdAt,
    ]);

    return expense;
  }

  async findByMonth(period: MonthPeriod): Promise<Expense[]> {
    const { startDate, endDate } = getMonthDateRange(period);
    const rows = await this.db.getAllAsync<ExpenseRow>(
      SELECT_EXPENSES_BY_MONTH_SQL,
      [startDate, endDate]
    );
    return rows.map(mapRowToExpense);
  }

  async deleteById(id: string): Promise<void> {
    const normalizedId = id.trim();
    if (!normalizedId) {
      throw new Error('ID da despesa é obrigatório para exclusão.');
    }
    await this.db.runAsync(DELETE_EXPENSE_BY_ID_SQL, [normalizedId]);
  }
}
