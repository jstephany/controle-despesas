import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { getDatabase } from '@/data/database/client';
import { SqliteBudgetRepository } from '@/data/repositories/SqliteBudgetRepository';
import { SqliteExpenseRepository } from '@/data/repositories/SqliteExpenseRepository';
import type { BudgetEvaluation, MonthlyBudget } from '@/domain/entities/Budget';
import type {
  CreateExpenseInput,
  Expense,
  MonthPeriod,
  UpdateExpenseInput,
} from '@/domain/entities/Expense';
import type { IBudgetRepository } from '@/domain/repositories/BudgetRepository';
import type { IExpenseRepository } from '@/domain/repositories/ExpenseRepository';
import { evaluateMonthlyBudget } from '@/domain/services/budgetService';
import {
  calculateCategoryBreakdown,
  calculateMonthlyTotal,
  sortExpensesChronologically,
  type CategoryBreakdownItem,
} from '@/domain/services/expenseCalculations';
import {
  getCurrentMonthPeriod,
  getMonthPeriodFromIsoDate,
  getNextMonth,
  getPreviousMonth,
} from '@/domain/utils/dateUtils';

export interface ExpensesContextValue {
  readonly selectedPeriod: MonthPeriod;
  readonly expenses: Expense[];
  readonly allExpenses: Expense[];
  readonly monthlyTotalCents: number;
  readonly categoryBreakdown: CategoryBreakdownItem[];
  readonly monthlyBudget: MonthlyBudget | null;
  readonly budgetEvaluation: BudgetEvaluation | null;
  readonly isInitializing: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly selectPeriod: (period: MonthPeriod) => void;
  readonly goToPreviousMonth: () => void;
  readonly goToNextMonth: () => void;
  readonly goToCurrentMonth: () => void;
  readonly getExpenseById: (id: string) => Promise<Expense | null>;
  readonly addExpense: (input: CreateExpenseInput) => Promise<Expense>;
  readonly updateExpense: (input: UpdateExpenseInput) => Promise<Expense>;
  readonly deleteExpense: (id: string) => Promise<void>;
  readonly saveMonthlyBudget: (limitCents: number) => Promise<MonthlyBudget>;
  readonly removeMonthlyBudget: () => Promise<void>;
  readonly refresh: () => Promise<void>;
}

export const ExpensesContext = createContext<ExpensesContextValue | null>(null);

interface ExpensesProviderProps {
  readonly children: ReactNode;
  readonly repository?: IExpenseRepository;
  readonly budgetRepository?: IBudgetRepository;
  readonly initialPeriod?: MonthPeriod;
}

function getPeriodKey(period: MonthPeriod): string {
  return `${period.year}-${period.month}`;
}

export function ExpensesProvider({
  children,
  repository: injectedRepository,
  budgetRepository: injectedBudgetRepository,
  initialPeriod,
}: ExpensesProviderProps) {
  const [sqliteRepository, setSqliteRepository] =
    useState<IExpenseRepository | null>(null);
  const [sqliteBudgetRepository, setSqliteBudgetRepository] =
    useState<IBudgetRepository | null>(null);
  const [initDone, setInitDone] = useState<boolean>(false);
  const [selectedPeriod, setSelectedPeriod] = useState<MonthPeriod>(
    () => initialPeriod ?? getCurrentMonthPeriod()
  );
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState<MonthlyBudget | null>(null);
  const [loadedPeriodKey, setLoadedPeriodKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRequestIdRef = useRef(0);

  const activeRepository = injectedRepository ?? sqliteRepository;
  const activeBudgetRepository =
    injectedBudgetRepository ?? sqliteBudgetRepository;
  const isInitializing = !injectedRepository && !initDone;
  const currentPeriodKey = getPeriodKey(selectedPeriod);
  const isLoading =
    isInitializing ||
    (activeRepository !== null && loadedPeriodKey !== currentPeriodKey);

  useEffect(() => {
    if (injectedRepository) {
      return;
    }

    let cancelled = false;
    getDatabase()
      .then((db) => {
        if (cancelled) return;
        setSqliteRepository(new SqliteExpenseRepository(db));
        setSqliteBudgetRepository(new SqliteBudgetRepository(db));
        setError(null);
        setInitDone(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível inicializar o banco de dados local.'
        );
        setInitDone(true);
      });

    return () => {
      cancelled = true;
    };
  }, [injectedRepository]);

  useEffect(() => {
    if (!activeRepository) {
      return;
    }

    let cancelled = false;
    activeRepository
      .findAll()
      .then((all) => {
        if (cancelled) return;
        setAllExpenses(sortExpensesChronologically(all));
      })
      .catch(() => {
        // Error surface is handled by the period load effect
      });

    return () => {
      cancelled = true;
    };
  }, [activeRepository]);

  useEffect(() => {
    if (!activeRepository) {
      return;
    }

    const requestId = ++loadRequestIdRef.current;
    const periodKey = getPeriodKey(selectedPeriod);

    Promise.all([
      activeRepository.findByMonth(selectedPeriod),
      activeBudgetRepository
        ? activeBudgetRepository.getByMonth(selectedPeriod)
        : Promise.resolve(null),
    ])
      .then(([expenseList, budget]) => {
        if (requestId !== loadRequestIdRef.current) return;
        setExpenses(sortExpensesChronologically(expenseList));
        setMonthlyBudget(budget);
        setError(null);
        setLoadedPeriodKey(periodKey);
      })
      .catch((err: unknown) => {
        if (requestId !== loadRequestIdRef.current) return;
        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível carregar as despesas deste mês.'
        );
        setLoadedPeriodKey(periodKey);
      });
  }, [activeRepository, activeBudgetRepository, selectedPeriod]);

  const selectPeriod = useCallback((period: MonthPeriod) => {
    setSelectedPeriod(period);
  }, []);

  const goToPreviousMonth = useCallback(() => {
    setSelectedPeriod((prev) => getPreviousMonth(prev));
  }, []);

  const goToNextMonth = useCallback(() => {
    setSelectedPeriod((prev) => getNextMonth(prev));
  }, []);

  const goToCurrentMonth = useCallback(() => {
    setSelectedPeriod(getCurrentMonthPeriod());
  }, []);

  const getExpenseById = useCallback(
    async (id: string): Promise<Expense | null> => {
      const inMemory =
        expenses.find((item) => item.id === id) ??
        allExpenses.find((item) => item.id === id);
      if (inMemory) {
        return inMemory;
      }
      if (!activeRepository) {
        return null;
      }
      return activeRepository.findById(id);
    },
    [expenses, allExpenses, activeRepository]
  );

  const addExpense = useCallback(
    async (input: CreateExpenseInput): Promise<Expense> => {
      if (!activeRepository) {
        throw new Error('Banco de dados local ainda não está pronto.');
      }

      const created = await activeRepository.create(input);
      setAllExpenses((prev) => sortExpensesChronologically([created, ...prev]));

      const expensePeriod = getMonthPeriodFromIsoDate(created.date);
      if (
        expensePeriod &&
        (expensePeriod.year !== selectedPeriod.year ||
          expensePeriod.month !== selectedPeriod.month)
      ) {
        setSelectedPeriod(expensePeriod);
      } else {
        setExpenses((prev) => sortExpensesChronologically([created, ...prev]));
      }

      return created;
    },
    [activeRepository, selectedPeriod]
  );

  const updateExpense = useCallback(
    async (input: UpdateExpenseInput): Promise<Expense> => {
      if (!activeRepository) {
        throw new Error('Banco de dados local ainda não está pronto.');
      }

      const updated = await activeRepository.update(input);
      setAllExpenses((prev) =>
        sortExpensesChronologically(
          prev.map((item) => (item.id === updated.id ? updated : item))
        )
      );

      const expensePeriod = getMonthPeriodFromIsoDate(updated.date);
      if (
        expensePeriod &&
        (expensePeriod.year !== selectedPeriod.year ||
          expensePeriod.month !== selectedPeriod.month)
      ) {
        setExpenses((prev) => prev.filter((item) => item.id !== updated.id));
        setSelectedPeriod(expensePeriod);
      } else {
        setExpenses((prev) =>
          sortExpensesChronologically(
            prev.map((item) => (item.id === updated.id ? updated : item))
          )
        );
      }

      return updated;
    },
    [activeRepository, selectedPeriod]
  );

  const deleteExpense = useCallback(
    async (id: string): Promise<void> => {
      if (!activeRepository) {
        throw new Error('Banco de dados local ainda não está pronto.');
      }

      await activeRepository.deleteById(id);
      setExpenses((prev) => prev.filter((item) => item.id !== id));
      setAllExpenses((prev) => prev.filter((item) => item.id !== id));
    },
    [activeRepository]
  );

  const saveMonthlyBudget = useCallback(
    async (limitCents: number): Promise<MonthlyBudget> => {
      if (!activeBudgetRepository) {
        throw new Error('Banco de dados local ainda não está pronto.');
      }

      const saved = await activeBudgetRepository.upsert(
        selectedPeriod,
        limitCents
      );
      setMonthlyBudget(saved);
      return saved;
    },
    [activeBudgetRepository, selectedPeriod]
  );

  const removeMonthlyBudget = useCallback(async (): Promise<void> => {
    if (!activeBudgetRepository) {
      throw new Error('Banco de dados local ainda não está pronto.');
    }

    await activeBudgetRepository.deleteByMonth(selectedPeriod);
    setMonthlyBudget(null);
  }, [activeBudgetRepository, selectedPeriod]);

  const refresh = useCallback(async () => {
    if (!activeRepository) {
      return;
    }
    const requestId = ++loadRequestIdRef.current;
    const periodKey = getPeriodKey(selectedPeriod);
    try {
      const [expenseList, all, budget] = await Promise.all([
        activeRepository.findByMonth(selectedPeriod),
        activeRepository.findAll(),
        activeBudgetRepository
          ? activeBudgetRepository.getByMonth(selectedPeriod)
          : Promise.resolve(null),
      ]);
      if (requestId === loadRequestIdRef.current) {
        setExpenses(sortExpensesChronologically(expenseList));
        setAllExpenses(sortExpensesChronologically(all));
        setMonthlyBudget(budget);
        setError(null);
        setLoadedPeriodKey(periodKey);
      }
    } catch (err) {
      if (requestId === loadRequestIdRef.current) {
        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível carregar as despesas deste mês.'
        );
        setLoadedPeriodKey(periodKey);
      }
    }
  }, [activeRepository, activeBudgetRepository, selectedPeriod]);

  const monthlyTotalCents = useMemo(
    () => calculateMonthlyTotal(expenses),
    [expenses]
  );

  const categoryBreakdown = useMemo(
    () => calculateCategoryBreakdown(expenses),
    [expenses]
  );

  const budgetEvaluation = useMemo(
    () =>
      monthlyBudget
        ? evaluateMonthlyBudget(monthlyTotalCents, monthlyBudget.limitCents)
        : null,
    [monthlyBudget, monthlyTotalCents]
  );

  const value = useMemo<ExpensesContextValue>(
    () => ({
      selectedPeriod,
      expenses,
      allExpenses,
      monthlyTotalCents,
      categoryBreakdown,
      monthlyBudget,
      budgetEvaluation,
      isInitializing,
      isLoading,
      error,
      selectPeriod,
      goToPreviousMonth,
      goToNextMonth,
      goToCurrentMonth,
      getExpenseById,
      addExpense,
      updateExpense,
      deleteExpense,
      saveMonthlyBudget,
      removeMonthlyBudget,
      refresh,
    }),
    [
      selectedPeriod,
      expenses,
      allExpenses,
      monthlyTotalCents,
      categoryBreakdown,
      monthlyBudget,
      budgetEvaluation,
      isInitializing,
      isLoading,
      error,
      selectPeriod,
      goToPreviousMonth,
      goToNextMonth,
      goToCurrentMonth,
      getExpenseById,
      addExpense,
      updateExpense,
      deleteExpense,
      saveMonthlyBudget,
      removeMonthlyBudget,
      refresh,
    ]
  );

  return (
    <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>
  );
}
