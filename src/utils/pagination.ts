import { PAGINATION } from '../config/constants';

/**
 * Pagination options interface
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Get pagination parameters
 */
export const getPagination = (
  page: string | number = PAGINATION.DEFAULT_PAGE,
  limit: string | number = PAGINATION.DEFAULT_LIMIT,
  maxLimit: number = PAGINATION.MAX_LIMIT
): { take: number; skip: number; page: number; limit: number } => {
  const parsedPage = typeof page === 'string' ? parseInt(page, 10) : page;
  const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit;

  const validPage = Math.max(1, parsedPage || PAGINATION.DEFAULT_PAGE);
  const validLimit = Math.min(
    Math.max(1, parsedLimit || PAGINATION.DEFAULT_LIMIT),
    maxLimit
  );

  const skip = (validPage - 1) * validLimit;

  return {
    take: validLimit,
    skip,
    page: validPage,
    limit: validLimit
  };
};

/**
 * Get paginated data
 */
export const getPagingData = <T>(
  data: { count: number; rows: T[] },
  page: string | number = PAGINATION.DEFAULT_PAGE,
  limit: string | number = PAGINATION.DEFAULT_LIMIT
): PaginatedResponse<T> => {
  const { page: currentPage, limit: currentLimit } = getPagination(page, limit);
  
  const total = data.count;
  const pages = Math.ceil(total / currentLimit);
  const hasNext = currentPage < pages;
  const hasPrev = currentPage > 1;

  return {
    data: data.rows,
    pagination: {
      page: currentPage,
      limit: currentLimit,
      total,
      pages,
      hasNext,
      hasPrev
    }
  };
};

/**
 * Get pagination metadata
 */
export const getPaginationMeta = (
  total: number,
  page: number,
  limit: number
): {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
} => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};

/**
 * Generate pagination links
 */
export const getPaginationLinks = (
  baseUrl: string,
  page: number,
  totalPages: number,
  limit: number
): { first: string; last: string; next?: string; prev?: string } => {
  const links: any = {
    first: `${baseUrl}?page=1&limit=${limit}`,
    last: `${baseUrl}?page=${totalPages}&limit=${limit}`
  };

  if (page < totalPages) {
    links.next = `${baseUrl}?page=${page + 1}&limit=${limit}`;
  }

  if (page > 1) {
    links.prev = `${baseUrl}?page=${page - 1}&limit=${limit}`;
  }

  return links;
};

/**
 * Get offset for raw queries
 */
export const getOffset = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (
  page: any,
  limit: any
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (page !== undefined) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('Page must be a positive integer');
    }
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > PAGINATION.MAX_LIMIT) {
      errors.push(`Limit must be between 1 and ${PAGINATION.MAX_LIMIT}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Parse sort parameter
 */
export const parseSort = (
  sortBy?: string,
  defaultSort: string = 'created_at',
  defaultOrder: 'ASC' | 'DESC' = 'DESC'
): { sort: string; order: 'ASC' | 'DESC' } => {
  if (!sortBy) {
    return { sort: defaultSort, order: defaultOrder };
  }

  const parts = sortBy.split(':');
  const sort = parts[0] || defaultSort;
  const order = (parts[1]?.toUpperCase() as 'ASC' | 'DESC') || defaultOrder;

  return { sort, order };
};

export default {
  getPagination,
  getPagingData,
  getPaginationMeta,
  getPaginationLinks,
  getOffset,
  validatePagination,
  parseSort
};