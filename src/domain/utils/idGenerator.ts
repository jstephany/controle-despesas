let counter = 0;

export function generateExpenseId(): string {
  counter = (counter + 1) % 100000;
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 8);
  const seq = counter.toString(36).padStart(3, '0');
  return `exp_${timestamp}_${seq}_${randomPart}`;
}
