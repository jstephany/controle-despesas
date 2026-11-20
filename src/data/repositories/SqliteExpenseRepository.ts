import { isValidCategory } from '@/domain/entities/Category';
import type {
  CreateExpenseInput,
  Expense,
  MonthPeriod,
  UpdateExpenseInput,
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

const UPDATE_EXPENSE_SQL = `
  UPDATE expenses
  SET description = ?, amount_cents = ?, date = ?, category = ?
  WHERE id = ?
`;

const SELECT_EXPENSE_BY_ID_SQL = `
  SELECT id, description, amount_cents, date, category, created_at
  FROM expenses
  WHERE id = ?
`;

const SELECT_EXPENSES_BY_MONTH_SQL = `
  SELECT id, description, amount_cents, date, category, created_at
  FROM expenses
  WHERE date >= ? AND date < ?
  ORDER BY date DESC, created_at DESC, id DESC
`;

const SELECT_ALL_EXPENSES_SQL = `
  SELECT id, description, amount_cents, date, category, created_at
  FROM expenses
  ORDER BY date DESC, created_at DESC, id DESC
`;

const DELETE_EXPENSE_BY_ID_SQL = `
  DELETE FROM expenses
  WHERE id = ?
`;

function validatePersistenceInput(input: CreateExpenseInput): string {
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

  return normalizedDescription;
}

export class SqliteExpenseRepository implements IExpenseRepository {
  constructor(private readonly db: SQLiteExecutor) {}

  async create(input: CreateExpenseInput): Promise<Expense> {
    const normalizedDescription = validatePersistenceInput(input);

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

  async findById(id: string): Promise<Expense | null> {
    const normalizedId = id.trim();
    if (!normalizedId) {
      return null;
    }

    const row = await this.db.getFirstAsync<ExpenseRow>(
      SELECT_EXPENSE_BY_ID_SQL,
      [normalizedId]
    );
    return row ? mapRowToExpense(row) : null;
  }

  async update(input: UpdateExpenseInput): Promise<Expense> {
    const normalizedId = input.id.trim();
    if (!normalizedId) {
      throw new Error('ID da despesa é obrigatório para atualização.');
    }

    const normalizedDescription = validatePersistenceInput(input);
    const existing = await this.findById(normalizedId);

    if (!existing) {
      throw new Error('Despesa não encontrada para atualização.');
    }

    await this.db.runAsync(UPDATE_EXPENSE_SQL, [
      normalizedDescription,
      input.amountCents,
      input.date,
      input.category,
      normalizedId,
    ]);

    return {
      ...existing,
      description: normalizedDescription,
      amountCents: input.amountCents,
      date: input.date,
      category: input.category,
    };
  }

  async findByMonth(period: MonthPeriod): Promise<Expense[]> {
    const { startDate, endDate } = getMonthDateRange(period);
    const rows = await this.db.getAllAsync<ExpenseRow>(
      SELECT_EXPENSES_BY_MONTH_SQL,
      [startDate, endDate]
    );
    return rows.map(mapRowToExpense);
  }

  async findAll(): Promise<Expense[]> {
    const rows = await this.db.getAllAsync<ExpenseRow>(
      SELECT_ALL_EXPENSES_SQL,
      []
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
