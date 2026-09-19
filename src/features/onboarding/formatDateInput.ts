/**
 * Formats free-typed digits into `ГГГГ-ММ-ДД` as the user types — auto-inserts `-` after the year
 * and month segments so the user never has to type the separator themselves (issue #48). Shared by
 * the student and teacher registration screens' "Дата рождения" field.
 */
export function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);
  return [year, month, day].filter(Boolean).join('-');
}
