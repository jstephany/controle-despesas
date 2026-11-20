import { formatCentsToBRL, parseCurrencyToCents } from '@/domain/services/currency';

describe('currency service', () => {
  describe('parseCurrencyToCents', () => {
    it('converte valores em formato brasileiro com vírgula para centavos inteiros', () => {
      expect(parseCurrencyToCents('12,50')).toBe(1250);
      expect(parseCurrencyToCents('12,5')).toBe(1250);
      expect(parseCurrencyToCents('0,01')).toBe(1);
      expect(parseCurrencyToCents('1.250,90')).toBe(125090);
      expect(parseCurrencyToCents('R$ 1.250,90')).toBe(125090);
      expect(parseCurrencyToCents('  R$ 45,00  ')).toBe(4500);
    });

    it('converte valores inteiros e formato com ponto decimal sem erro de ponto flutuante', () => {
      expect(parseCurrencyToCents('45')).toBe(4500);
      expect(parseCurrencyToCents('19.99')).toBe(1999);
      expect(parseCurrencyToCents('12.5')).toBe(1250);
      expect(parseCurrencyToCents('1,250.90')).toBe(125090);
      expect(parseCurrencyToCents('1.250')).toBe(125000);
    });

    it('rejeita zero, valores negativos, vazios e textos não numéricos', () => {
      expect(parseCurrencyToCents('')).toBeNull();
      expect(parseCurrencyToCents('   ')).toBeNull();
      expect(parseCurrencyToCents('0')).toBeNull();
      expect(parseCurrencyToCents('0,00')).toBeNull();
      expect(parseCurrencyToCents('0.00')).toBeNull();
      expect(parseCurrencyToCents('-10,00')).toBeNull();
      expect(parseCurrencyToCents('-0,01')).toBeNull();
      expect(parseCurrencyToCents('abc')).toBeNull();
      expect(parseCurrencyToCents('12,5a')).toBeNull();
      expect(parseCurrencyToCents('12,345')).toBeNull();
      expect(parseCurrencyToCents('1,2,3')).toBeNull();
      expect(parseCurrencyToCents('R$')).toBeNull();
    });
  });

  describe('formatCentsToBRL', () => {
    it('formata centavos positivos e zero no padrão monetário brasileiro', () => {
      expect(formatCentsToBRL(0)).toBe('R$ 0,00');
      expect(formatCentsToBRL(1)).toBe('R$ 0,01');
      expect(formatCentsToBRL(1250)).toBe('R$ 12,50');
      expect(formatCentsToBRL(125090)).toBe('R$ 1.250,90');
      expect(formatCentsToBRL(100000000)).toBe('R$ 1.000.000,00');
    });

    it('formata valores negativos de forma consistente', () => {
      expect(formatCentsToBRL(-1050)).toBe('-R$ 10,50');
    });
  });
});
