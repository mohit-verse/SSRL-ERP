/**
 * Generates a Prisma search condition for string fields.
 */
export const buildSearchCondition = (fields: string[], query?: string) => {
  if (!query || query.trim() === '') return undefined;

  const searchParam = query.trim();

  return {
    OR: fields.map((field) => ({
      [field]: {
        contains: searchParam,
        mode: 'insensitive',
      },
    })),
  };
};
