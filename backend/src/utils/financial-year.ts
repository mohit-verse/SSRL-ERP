export const getCurrentFinancialYear = (
  date: Date = new Date(),
): { start: Date; end: Date; name: string } => {
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth(); // 0-indexed (0 = January, 3 = April)

  let startYear = currentYear;
  let endYear = currentYear + 1;

  // If before April, it belongs to the previous financial year
  if (currentMonth < 3) {
    startYear = currentYear - 1;
    endYear = currentYear;
  }

  return {
    start: new Date(startYear, 3, 1), // April 1st
    end: new Date(endYear, 2, 31, 23, 59, 59, 999), // March 31st
    name: `${startYear}-${String(endYear).substring(2)}`, // e.g., 2026-27
  };
};
