import type { SQLiteBindParams } from 'expo-sqlite';

import type { SQLiteExecutor } from '@/data/database/types';
import type { ExpenseRow } from '@/data/mappers/expenseMapper';
import { SqliteExpenseRepository } from '@/data/repositories/SqliteExpenseRepository';

function createInMemorySqliteStub() {
  const rows: ExpenseRow[] = [];
  const runCalls: { sql: string; params: SQLiteBindParams }[] = [];
  const queryCalls: { sql: string; params: SQLiteBindParams }[] = [];

  const db: SQLiteExecutor = {
    execAsync: jest.fn(async () => undefined),
    async getFirstAsync<T>(sql: string, params?: SQLiteBindParams): Promise<T | null> {
      const values = Array.isArray(params) ? params : [];
      if (sql.includes('WHERE id = ?')) {
        const targetId = String(values[0]);
        const found = rows.find((row) => row.id === targetId) ?? null;
        return found as T | null;
      }
      return null;
    },
    runAsync: jest.fn(async (sql: string, params: SQLiteBindParams) => {
      runCalls.push({ sql, params });
      const values = Array.isArray(params) ? params : [];

      if (sql.trim().startsWith('INSERT INTO expenses')) {
        rows.push({
          id: String(values[0]),
          description: String(values[1]),
          amount_cents: Number(values[2]),
          date: String(values[3]),
          category: String(values[4]),
          created_at: String(values[5]),
        });
        return { changes: 1, lastInsertRowId: rows.length };
      }

      if (sql.trim().startsWith('UPDATE expenses')) {
        const targetId = String(values[4]);
        const index = rows.findIndex((row) => row.id === targetId);
        if (index === -1) {
          return { changes: 0, lastInsertRowId: 0 };
        }
        rows[index] = {
          ...rows[index],
          description: String(values[0]),
          amount_cents: Number(values[1]),
          date: String(values[2]),
          category: String(values[3]),
        };
        return { changes: 1, lastInsertRowId: 0 };
      }

      if (sql.trim().startsWith('DELETE FROM expenses')) {
        const targetId = String(values[0]);
        const before = rows.length;
        for (let i = rows.length - 1; i >= 0; i--) {
          if (rows[i].id === targetId) {
            rows.splice(i, 1);
          }
        }
        return { changes: before - rows.length, lastInsertRowId: 0 };
      }

      return { changes: 0, lastInsertRowId: 0 };
    }),
    async getAllAsync<T>(sql: string, params: SQLiteBindParams): Promise<T[]> {
      queryCalls.push({ sql, params });
      const values = Array.isArray(params) ? params : [];

      const base = sql.includes('WHERE date >= ? AND date < ?')
        ? rows.filter(
            (r) => r.date >= String(values[0]) && r.date < String(values[1])
          )
        : [...rows];

      const sorted = base.sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        if (a.created_at !== b.created_at) return b.created_at.localeCompare(a.created_at);
        return b.id.localeCompare(a.id);
      });

      return sorted as T[];
    },
  };

  return { db, rows, runCalls, queryCalls };
}

describe('SqliteExpenseRepository', () => {
  it('persiste uma despesa válida com parâmetros bindados e retorna a entidade criada', async () => {
    const { db, rows, runCalls } = createInMemorySqliteStub();
    const repository = new SqliteExpenseRepository(db);

    const created = await repository.create({
      description: '  Supermercado  ',
      amountCents: 15990,
      date: '2026-11-20',
      category: 'alimentacao',
    });

    expect(created.id).toMatch(/^exp_/);
    expect(created.description).toBe('Supermercado');
    expect(created.amountCents).toBe(15990);
    expect(created.date).toBe('2026-11-20');
    expect(created.category).toBe('alimentacao');
    expect(created.createdAt).toBeTruthy();

    expect(rows).toHaveLength(1);
    expect(runCalls[0].sql).toContain('INSERT INTO expenses');
    expect(runCalls[0].params).toEqual([
      created.id,
      'Supermercado',
      15990,
      '2026-11-20',
      'alimentacao',
      created.createdAt,
    ]);
  });

  it('rejeita criação defensivamente quando valor <= 0, descrição vazia ou data inválida', async () => {
    const { db } = createInMemorySqliteStub();
    const repository = new SqliteExpenseRepository(db);

    await expect(
      repository.create({
        description: 'Café',
        amountCents: 0,
        date: '2026-11-20',
        category: 'alimentacao',
      })
    ).rejects.toThrow();

    await expect(
      repository.create({
        description: '   ',
        amountCents: 1000,
        date: '2026-11-20',
        category: 'alimentacao',
      })
    ).rejects.toThrow();

    await expect(
      repository.create({
        description: 'Café',
        amountCents: 1000,
        date: '2026-02-30',
        category: 'alimentacao',
      })
    ).rejects.toThrow();

    expect(db.runAsync).not.toHaveBeenCalled();
  });

  it('consulta despesas do mês usando intervalo [startDate, endDate) ordenado cronologicamente', async () => {
    const { db, queryCalls } = createInMemorySqliteStub();
    const repository = new SqliteExpenseRepository(db);

    await repository.create({
      description: 'Despesa Outubro',
      amountCents: 5000,
      date: '2026-10-31',
      category: 'outros',
    });
    await repository.create({
      description: 'Almoço Novembro',
      amountCents: 3500,
      date: '2026-11-05',
      category: 'alimentacao',
    });
    await repository.create({
      description: 'Mercado Novembro',
      amountCents: 12000,
      date: '2026-11-20',
      category: 'alimentacao',
    });
    await repository.create({
      description: 'Despesa Dezembro',
      amountCents: 8000,
      date: '2026-12-01',
      category: 'lazer',
    });

    const novExpenses = await repository.findByMonth({ year: 2026, month: 11 });

    expect(novExpenses.map((e) => e.description)).toEqual([
      'Mercado Novembro',
      'Almoço Novembro',
    ]);
    expect(queryCalls[0].sql).toContain('WHERE date >= ? AND date < ?');
    expect(queryCalls[0].sql).toContain('ORDER BY date DESC, created_at DESC, id DESC');
    expect(queryCalls[0].params).toEqual(['2026-11-01', '2026-12-01']);

    const decExpenses = await repository.findByMonth({ year: 2026, month: 12 });
    expect(decExpenses.map((e) => e.description)).toEqual(['Despesa Dezembro']);
    expect(queryCalls[1].params).toEqual(['2026-12-01', '2027-01-01']);
  });

  it('remove despesa por id e reflete imediatamente em consultas subsequentes', async () => {
    const { db } = createInMemorySqliteStub();
    const repository = new SqliteExpenseRepository(db);

    const first = await repository.create({
      description: 'Uber',
      amountCents: 2500,
      date: '2026-11-15',
      category: 'transporte',
    });
    const second = await repository.create({
      description: 'Farmácia',
      amountCents: 4200,
      date: '2026-11-16',
      category: 'saude',
    });

    await repository.deleteById(first.id);

    const remaining = await repository.findByMonth({ year: 2026, month: 11 });
    expect(remaining.map((e) => e.id)).toEqual([second.id]);
  });

  it('rejeita deleteById quando id está vazio', async () => {
    const { db } = createInMemorySqliteStub();
    const repository = new SqliteExpenseRepository(db);

    await expect(repository.deleteById('   ')).rejects.toThrow();
    expect(db.runAsync).not.toHaveBeenCalled();
  });

  it('busca despesa por id e retorna null quando inexistente', async () => {
    const { db } = createInMemorySqliteStub();
    const repository = new SqliteExpenseRepository(db);

    const created = await repository.create({
      description: 'Livro',
      amountCents: 6500,
      date: '2026-11-12',
      category: 'educacao',
    });

    await expect(repository.findById(created.id)).resolves.toEqual(created);
    await expect(repository.findById('exp_inexistente')).resolves.toBeNull();
  });

  it('atualiza uma despesa existente preservando createdAt e refletindo nas consultas mensais', async () => {
    const { db, runCalls } = createInMemorySqliteStub();
    const repository = new SqliteExpenseRepository(db);

    const created = await repository.create({
      description: 'Almoço',
      amountCents: 3500,
      date: '2026-11-10',
      category: 'alimentacao',
    });

    const updated = await repository.update({
      id: created.id,
      description: '  Almoço executivo  ',
      amountCents: 4890,
      date: '2026-12-02',
      category: 'lazer',
    });

    expect(updated).toEqual({
      id: created.id,
      description: 'Almoço executivo',
      amountCents: 4890,
      date: '2026-12-02',
      category: 'lazer',
      createdAt: created.createdAt,
    });

    const updateCall = runCalls.find((call) => call.sql.includes('UPDATE expenses'));
    expect(updateCall?.params).toEqual([
      'Almoço executivo',
      4890,
      '2026-12-02',
      'lazer',
      created.id,
    ]);

    expect(await repository.findByMonth({ year: 2026, month: 11 })).toEqual([]);
    const decExpenses = await repository.findByMonth({ year: 2026, month: 12 });
    expect(decExpenses).toEqual([updated]);
  });

  it('rejeita atualização quando despesa não existe ou dados são inválidos', async () => {
    const { db } = createInMemorySqliteStub();
    const repository = new SqliteExpenseRepository(db);

    const created = await repository.create({
      description: 'Café',
      amountCents: 900,
      date: '2026-11-10',
      category: 'alimentacao',
    });

    await expect(
      repository.update({
        id: 'exp_nao_existe',
        description: 'Café',
        amountCents: 900,
        date: '2026-11-10',
        category: 'alimentacao',
      })
    ).rejects.toThrow();

    await expect(
      repository.update({
        id: created.id,
        description: 'Café',
        amountCents: 0,
        date: '2026-11-10',
        category: 'alimentacao',
      })
    ).rejects.toThrow();

    await expect(
      repository.update({
        id: created.id,
        description: '   ',
        amountCents: 900,
        date: '2026-11-10',
        category: 'alimentacao',
      })
    ).rejects.toThrow();
  });

  it('lista todas as despesas de múltiplos meses ordenadas cronologicamente via findAll', async () => {
    const { db } = createInMemorySqliteStub();
    const repository = new SqliteExpenseRepository(db);

    await repository.create({
      description: 'Despesa Setembro',
      amountCents: 5000,
      date: '2026-09-10',
      category: 'outros',
    });
    await repository.create({
      description: 'Despesa Novembro',
      amountCents: 9000,
      date: '2026-11-20',
      category: 'alimentacao',
    });
    await repository.create({
      description: 'Despesa Outubro',
      amountCents: 7000,
      date: '2026-10-15',
      category: 'transporte',
    });

    const all = await repository.findAll();
    expect(all.map((item) => item.description)).toEqual([
      'Despesa Novembro',
      'Despesa Outubro',
      'Despesa Setembro',
    ]);
  });
});
