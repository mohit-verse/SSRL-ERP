/**
 * Indian Financial Year Helper (1 April - 31 March)
 */

export interface FinancialYear {
  label: string; // e.g. "FY 2025-26"
  startDate: Date;
  endDate: Date;
}

export function getIndianFinancialYear(date: Date = new Date()): FinancialYear {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed (0 = Jan, 3 = April)

  let startYear: number;
  let endYear: number;

  if (month >= 3) {
    // April (3) to Dec (11)
    startYear = year;
    endYear = year + 1;
  } else {
    // Jan (0) to March (2)
    startYear = year - 1;
    endYear = year;
  }

  const startDate = new Date(startYear, 3, 1, 0, 0, 0, 0); // April 1st
  const endDate = new Date(endYear, 2, 31, 23, 59, 59, 999); // March 31st

  const label = `FY ${startYear}-${(endYear % 100).toString().padStart(2, '0')}`;

  return {
    label,
    startDate,
    endDate,
  };
}

export function isDateInActiveFY(date: Date, referenceDate: Date = new Date()): boolean {
  const currentFY = getIndianFinancialYear(referenceDate);
  return date >= currentFY.startDate && date <= currentFY.endDate;
}
