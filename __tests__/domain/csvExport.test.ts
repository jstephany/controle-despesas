import type { Expense } from '@/domain/entities/Expense';
import {
  buildCsvFileName,
  buildMonthlyCsvFileName,
  formatExpensesToCsv,
} from '@/domain/services/csvExport';

describe('csvExport', () => {
  it('gera cabeçalho em português e formata linhas com data BR, categoria legível e escape RFC 4180', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        description: 'Almoço, café e "sobremesa"',
        amountCents: 4590,
        date: '2026-11-20',
        category: 'alimentacao',
        createdAt: '2026-11-20T12:00:00.000Z',
      },
      {
        id: 'e2',
        description: 'Plano de saúde\nmensal',
        amountCents: 35000,
        date: '2026-11-05',
        category: 'saude',
        createdAt: '2026-11-05T08:00:00.000Z',
      },
    ];

    const csv = formatExpensesToCsv(expenses);
    const lines = csv.split('\n');

    expect(lines[0]).toBe('Data,Descrição,Categoria,Valor (R$)');
    expect(lines[1]).toBe(
      '20/11/2026,"Almoço, café e ""sobremesa""",Alimentação,"45,90"'
    );
    expect(csv).toContain('05/11/2026,"Plano de saúde\nmensal",Saúde,"350,00"');
  });

  it('retorna apenas o cabeçalho quando a lista de despesas está vazia', () => {
    expect(formatExpensesToCsv([])).toBe('Data,Descrição,Categoria,Valor (R$)');
  });

  it('gera nome de arquivo limpo incluindo período, categoria opcional e data', () => {
    const refDate = new Date(2026, 10, 20);
    expect(buildCsvFileName('last_3_months', null, refDate)).toBe(
      'despesas-ultimos-3-meses-2026-11-20.csv'
    );
    expect(buildCsvFileName('this_year', 'alimentacao', refDate)).toBe(
      'despesas-este-ano-alimentacao-2026-11-20.csv'
    );
  });

  it('gera nome de arquivo mensal no formato despesas-YYYY-MM.csv', () => {
    expect(buildMonthlyCsvFileName({ year: 2026, month: 3 })).toBe(
      'despesas-2026-03.csv'
    );
    expect(buildMonthlyCsvFileName({ year: 2026, month: 11 })).toBe(
      'despesas-2026-11.csv'
    );
  });
});
