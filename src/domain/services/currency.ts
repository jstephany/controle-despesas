const BR_FULL_PATTERN = /^\d{1,3}(\.\d{3})*,\d{1,2}$/;
const US_FULL_PATTERN = /^\d{1,3}(,\d{3})*\.\d{1,2}$/;
const BR_DECIMAL_PATTERN = /^\d+,\d{1,2}$/;
const US_DECIMAL_PATTERN = /^\d+\.\d{1,2}$/;
const BR_THOUSANDS_ONLY_PATTERN = /^\d{1,3}(\.\d{3})+$/;
const DIGITS_ONLY_PATTERN = /^\d+$/;

export function parseCurrencyToCents(raw: string): number | null {
  const cleaned = raw.trim().replace(/^R\$\s*/i, '').trim();

  if (!cleaned || /[^\d.,]/.test(cleaned)) {
    return null;
  }

  let integerPart: string;
  let centsPart = '00';

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    if (BR_FULL_PATTERN.test(cleaned)) {
      const [intRaw, decRaw] = cleaned.split(',');
      integerPart = intRaw.replace(/\./g, '');
      centsPart = decRaw;
    } else if (US_FULL_PATTERN.test(cleaned)) {
      const [intRaw, decRaw] = cleaned.split('.');
      integerPart = intRaw.replace(/,/g, '');
      centsPart = decRaw;
    } else {
      return null;
    }
  } else if (hasComma) {
    if (!BR_DECIMAL_PATTERN.test(cleaned)) {
      return null;
    }
    const [intRaw, decRaw] = cleaned.split(',');
    integerPart = intRaw;
    centsPart = decRaw;
  } else if (hasDot) {
    if (BR_THOUSANDS_ONLY_PATTERN.test(cleaned)) {
      integerPart = cleaned.replace(/\./g, '');
    } else if (US_DECIMAL_PATTERN.test(cleaned)) {
      const [intRaw, decRaw] = cleaned.split('.');
      integerPart = intRaw;
      centsPart = decRaw;
    } else {
      return null;
    }
  } else if (DIGITS_ONLY_PATTERN.test(cleaned)) {
    integerPart = cleaned;
  } else {
    return null;
  }

  const paddedCents = centsPart.padEnd(2, '0');
  const totalCents = Number(integerPart) * 100 + Number(paddedCents);

  if (!Number.isSafeInteger(totalCents) || totalCents <= 0) {
    return null;
  }

  return totalCents;
}

export function formatCentsToBRL(amountCents: number): string {
  const safeCents = Math.trunc(amountCents);
  const isNegative = safeCents < 0;
  const absCents = Math.abs(safeCents);

  const reais = Math.floor(absCents / 100);
  const cents = String(absCents % 100).padStart(2, '0');
  const formattedReais = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${isNegative ? '-' : ''}R$ ${formattedReais},${cents}`;
}

export function formatCentsToInputValue(amountCents: number): string {
  const absCents = Math.abs(Math.trunc(amountCents));
  const reais = Math.floor(absCents / 100);
  const cents = String(absCents % 100).padStart(2, '0');
  return `${reais},${cents}`;
}
