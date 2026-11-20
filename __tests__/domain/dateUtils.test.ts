import {
  formatIsoDateToBR,
  formatMonthPeriodKey,
  formatMonthPeriodLabel,
  getCurrentMonthPeriod,
  getMonthDateRange,
  getMonthPeriodFromIsoDate,
  getNextMonth,
  getPreviousMonth,
  getRelativeIsoDate,
  getTodayIsoDate,
  isValidIsoDate,
  isValidMonthKey,
  parseUserDateToIso,
} from '@/domain/utils/dateUtils';

describe('dateUtils', () => {
  describe('isValidIsoDate', () => {
    it('aceita datas reais no formato YYYY-MM-DD incluindo ano bissexto', () => {
      expect(isValidIsoDate('2026-11-20')).toBe(true);
      expect(isValidIsoDate('2024-02-29')).toBe(true);
      expect(isValidIsoDate('2026-01-01')).toBe(true);
      expect(isValidIsoDate('2026-12-31')).toBe(true);
    });

    it('rejeita datas inexistentes ou mal formatadas', () => {
      expect(isValidIsoDate('2026-02-29')).toBe(false);
      expect(isValidIsoDate('2026-02-30')).toBe(false);
      expect(isValidIsoDate('2026-04-31')).toBe(false);
      expect(isValidIsoDate('2026-13-01')).toBe(false);
      expect(isValidIsoDate('2026-00-10')).toBe(false);
      expect(isValidIsoDate('20/11/2026')).toBe(false);
      expect(isValidIsoDate('')).toBe(false);
    });
  });

  describe('parseUserDateToIso', () => {
    it('converte formato brasileiro DD/MM/AAAA e ISO YYYY-MM-DD válidos', () => {
      expect(parseUserDateToIso('20/11/2026')).toBe('2026-11-20');
      expect(parseUserDateToIso(' 05/03/2026 ')).toBe('2026-03-05');
      expect(parseUserDateToIso('2026-11-20')).toBe('2026-11-20');
    });

    it('rejeita datas inválidas como 31/02/2026 ou texto livre', () => {
      expect(parseUserDateToIso('31/02/2026')).toBeNull();
      expect(parseUserDateToIso('29/02/2026')).toBeNull();
      expect(parseUserDateToIso('99/99/2026')).toBeNull();
      expect(parseUserDateToIso('ontem')).toBeNull();
      expect(parseUserDateToIso('')).toBeNull();
    });
  });

  describe('formatIsoDateToBR', () => {
    it('formata YYYY-MM-DD para DD/MM/AAAA', () => {
      expect(formatIsoDateToBR('2026-11-20')).toBe('20/11/2026');
      expect(formatIsoDateToBR('2026-01-05')).toBe('05/01/2026');
    });
  });

  describe('navegação de mês/ano e intervalos', () => {
    it('calcula intervalo [startDate, endDate) inclusive/exclusivo corretamente', () => {
      expect(getMonthDateRange({ year: 2026, month: 11 })).toEqual({
        startDate: '2026-11-01',
        endDate: '2026-12-01',
      });
      expect(getMonthDateRange({ year: 2026, month: 12 })).toEqual({
        startDate: '2026-12-01',
        endDate: '2027-01-01',
      });
    });

    it('navega para mês anterior e próximo respeitando virada de ano', () => {
      expect(getPreviousMonth({ year: 2026, month: 1 })).toEqual({ year: 2025, month: 12 });
      expect(getPreviousMonth({ year: 2026, month: 6 })).toEqual({ year: 2026, month: 5 });
      expect(getNextMonth({ year: 2026, month: 12 })).toEqual({ year: 2027, month: 1 });
      expect(getNextMonth({ year: 2026, month: 6 })).toEqual({ year: 2026, month: 7 });
    });

    it('formata rótulo do período em português', () => {
      expect(formatMonthPeriodLabel({ year: 2026, month: 1 })).toBe('Janeiro de 2026');
      expect(formatMonthPeriodLabel({ year: 2026, month: 11 })).toBe('Novembro de 2026');
      expect(formatMonthPeriodLabel({ year: 2026, month: 12 })).toBe('Dezembro de 2026');
    });

    it('extrai período e datas locais de referência sem deslocamento de fuso', () => {
      const ref = new Date(2026, 10, 20, 23, 30, 0); // 20/11/2026 23:30 local
      expect(getCurrentMonthPeriod(ref)).toEqual({ year: 2026, month: 11 });
      expect(getTodayIsoDate(ref)).toBe('2026-11-20');
      expect(getRelativeIsoDate(-1, ref)).toBe('2026-11-19');
      expect(getMonthPeriodFromIsoDate('2026-11-20')).toEqual({ year: 2026, month: 11 });
      expect(getMonthPeriodFromIsoDate('invalid')).toBeNull();
    });

    it('formata e valida chaves mensais no padrão YYYY-MM', () => {
      expect(formatMonthPeriodKey({ year: 2026, month: 3 })).toBe('2026-03');
      expect(formatMonthPeriodKey({ year: 2026, month: 11 })).toBe('2026-11');
      expect(isValidMonthKey('2026-01')).toBe(true);
      expect(isValidMonthKey('2026-12')).toBe(true);
      expect(isValidMonthKey('2026-13')).toBe(false);
      expect(isValidMonthKey('2026-00')).toBe(false);
      expect(isValidMonthKey('11/2026')).toBe(false);
    });
  });
});
