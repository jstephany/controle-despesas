import type { MonthPeriod } from '../entities/Expense';

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const BR_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const MONTH_KEY_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

const MONTH_NAMES_PT_BR = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function isRealCalendarDate(year: number, month: number, day: number): boolean {
  if (year < 1900 || year > 2999 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const probe = new Date(year, month - 1, day);
  return (
    probe.getFullYear() === year &&
    probe.getMonth() === month - 1 &&
    probe.getDate() === day
  );
}

export function isValidIsoDate(value: string): boolean {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return isRealCalendarDate(year, month, day);
}

export function parseUserDateToIso(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (ISO_DATE_PATTERN.test(trimmed)) {
    return isValidIsoDate(trimmed) ? trimmed : null;
  }

  const brMatch = BR_DATE_PATTERN.exec(trimmed);
  if (!brMatch) {
    return null;
  }

  const day = Number(brMatch[1]);
  const month = Number(brMatch[2]);
  const year = Number(brMatch[3]);

  if (!isRealCalendarDate(year, month, day)) {
    return null;
  }

  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function formatIsoDateToBR(isoDate: string): string {
  const match = ISO_DATE_PATTERN.exec(isoDate);
  if (!match) {
    return isoDate;
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function getMonthDateRange(period: MonthPeriod): {
  startDate: string;
  endDate: string;
} {
  const next = getNextMonth(period);
  return {
    startDate: `${period.year}-${pad2(period.month)}-01`,
    endDate: `${next.year}-${pad2(next.month)}-01`,
  };
}

export function getPreviousMonth(period: MonthPeriod): MonthPeriod {
  if (period.month === 1) {
    return { year: period.year - 1, month: 12 };
  }
  return { year: period.year, month: period.month - 1 };
}

export function getNextMonth(period: MonthPeriod): MonthPeriod {
  if (period.month === 12) {
    return { year: period.year + 1, month: 1 };
  }
  return { year: period.year, month: period.month + 1 };
}

export function getCurrentMonthPeriod(referenceDate: Date = new Date()): MonthPeriod {
  return {
    year: referenceDate.getFullYear(),
    month: referenceDate.getMonth() + 1,
  };
}

export function getTodayIsoDate(referenceDate: Date = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth() + 1;
  const day = referenceDate.getDate();
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function getRelativeIsoDate(
  daysOffset: number,
  referenceDate: Date = new Date()
): string {
  const target = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() + daysOffset
  );
  return getTodayIsoDate(target);
}

export function formatMonthPeriodLabel(period: MonthPeriod): string {
  const monthName = MONTH_NAMES_PT_BR[period.month - 1] ?? '';
  return `${monthName} de ${period.year}`;
}

export function getMonthPeriodFromIsoDate(isoDate: string): MonthPeriod | null {
  if (!isValidIsoDate(isoDate)) {
    return null;
  }
  const [yearStr, monthStr] = isoDate.split('-');
  return {
    year: Number(yearStr),
    month: Number(monthStr),
  };
}

export function formatMonthPeriodKey(period: MonthPeriod): string {
  return `${period.year}-${pad2(period.month)}`;
}

export function isValidMonthKey(value: string): boolean {
  return MONTH_KEY_PATTERN.test(value);
}
