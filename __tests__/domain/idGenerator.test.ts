import { generateExpenseId } from '@/domain/utils/idGenerator';

describe('idGenerator', () => {
  it('gera identificadores únicos e não vazios no formato esperado', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const id = generateExpenseId();
      expect(id.startsWith('exp_')).toBe(true);
      expect(id.length).toBeGreaterThan(10);
      ids.add(id);
    }
    expect(ids.size).toBe(100);
  });
});
