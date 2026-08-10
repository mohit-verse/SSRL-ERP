export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getPaginationOptions = (page: number = 1, limit: number = 10) => {
  const validPage = Math.max(1, page);
  const validLimit = Math.max(1, Math.min(limit, 100)); // Cap limit at 100

  return {
    skip: (validPage - 1) * validLimit,
    take: validLimit,
  };
};

export const buildPaginatedResult = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> => {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
