import { Op } from 'sequelize';
import { ParsedQs } from 'qs';

/**
 * Filter operators
 */
export const FILTER_OPERATORS = {
  eq: Op.eq,
  ne: Op.ne,
  gt: Op.gt,
  gte: Op.gte,
  lt: Op.lt,
  lte: Op.lte,
  like: Op.like,
  ilike: Op.iLike,
  in: Op.in,
  notIn: Op.notIn,
  between: Op.between,
  notBetween: Op.notBetween,
  and: Op.and,
  or: Op.or
};

/**
 * Parse filter parameters
 */
export const parseFilters = (
  query: ParsedQs,
  allowedFields: string[],
  customMappings?: { [key: string]: string }
): any => {
  const where: any = {};

  Object.keys(query).forEach(key => {
    // Skip pagination and sorting parameters
    if (['page', 'limit', 'sort', 'fields'].includes(key)) {
      return;
    }

    const value = query[key];
    if (!value) return;

    // Handle operator syntax (field[operator]=value)
    if (key.includes('[') && key.includes(']')) {
      const [field, operator] = key.split(/[\[\]]/).filter(Boolean);
      
      if (allowedFields.includes(field) || field === 'id') {
        const mappedField = customMappings?.[field] || field;
        
        if (operator in FILTER_OPERATORS) {
          where[mappedField] = {
            [FILTER_OPERATORS[operator as keyof typeof FILTER_OPERATORS]]: parseValue(value)
          };
        }
      }
    } 
    // Handle simple field = value
    else if (allowedFields.includes(key) || key === 'id') {
      const mappedField = customMappings?.[key] || key;
      where[mappedField] = parseValue(value);
    }
  });

  return where;
};

/**
 * Parse value based on type
 */
const parseValue = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map(v => parseValue(v));
  }

  if (typeof value === 'string') {
    // Try to parse as number
    if (!isNaN(Number(value)) && value.trim() !== '') {
      return Number(value);
    }
    
    // Try to parse as boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    // Try to parse as date
    const date = new Date(value);
    if (!isNaN(date.getTime()) && value.includes('-')) {
      return date;
    }
  }

  return value;
};

/**
 * Build search condition
 */
export const buildSearchCondition = (
  search: string,
  fields: string[]
): any => {
  if (!search || fields.length === 0) return {};

  const conditions = fields.map(field => ({
    [field]: { [Op.iLike]: `%${search}%` }
  }));

  return { [Op.or]: conditions };
};

/**
 * Build date range filter
 */
export const buildDateRangeFilter = (
  field: string,
  startDate?: Date | string,
  endDate?: Date | string
): any => {
  if (!startDate && !endDate) return {};

  const condition: any = {};

  if (startDate) {
    condition[Op.gte] = new Date(startDate);
  }

  if (endDate) {
    condition[Op.lte] = new Date(endDate);
  }

  return { [field]: condition };
};

/**
 * Build tag filter
 */
export const buildTagFilter = (field: string, tags: string | string[]): any => {
  const tagArray = Array.isArray(tags) ? tags : [tags];
  
  if (tagArray.length === 0) return {};
  
  return {
    [field]: { [Op.overlap]: tagArray }
  };
};

/**
 * Build array filter
 */
export const buildArrayFilter = (
  field: string,
  values: any | any[],
  operator: 'contains' | 'contained' | 'overlap' = 'contains'
): any => {
  const valueArray = Array.isArray(values) ? values : [values];

  switch (operator) {
    case 'contains':
      return { [field]: { [Op.contains]: valueArray } };
    case 'contained':
      return { [field]: { [Op.contained]: valueArray } };
    case 'overlap':
      return { [field]: { [Op.overlap]: valueArray } };
    default:
      return {};
  }
};

/**
 * Build status filter
 */
export const buildStatusFilter = (
  field: string,
  status: string | string[]
): any => {
  const statusArray = Array.isArray(status) ? status : [status];
  
  if (statusArray.length === 0) return {};
  
  return {
    [field]: { [Op.in]: statusArray }
  };
};

/**
 * Build user filter based on role
 */
export const buildUserFilter = (
  user: any,
  field: string = 'user_id'
): any => {
  if (!user) return {};

  if (user.role === 'admin') {
    return {}; // Admin sees all
  }

  if (user.role === 'manager') {
    return {}; // Managers see all (can be modified based on requirements)
  }

  // Agents see only their own
  return { [field]: user.id };
};

/**
 * Combine filters with AND/OR
 */
export const combineFilters = (
  filters: any[],
  operator: 'and' | 'or' = 'and'
): any => {
  const validFilters = filters.filter(f => f && Object.keys(f).length > 0);

  if (validFilters.length === 0) return {};
  if (validFilters.length === 1) return validFilters[0];

  if (operator === 'and') {
    return { [Op.and]: validFilters };
  } else {
    return { [Op.or]: validFilters };
  }
};

/**
 * Parse fields to select
 */
export const parseFields = (
  fields?: string,
  defaultFields: string[] = []
): string[] => {
  if (!fields) return defaultFields;
  
  return fields.split(',').map(f => f.trim());
};

/**
 * Parse includes/relations
 */
export const parseIncludes = (include?: string): string[] => {
  if (!include) return [];
  
  return include.split(',').map(i => i.trim());
};

export default {
  parseFilters,
  buildSearchCondition,
  buildDateRangeFilter,
  buildTagFilter,
  buildArrayFilter,
  buildStatusFilter,
  buildUserFilter,
  combineFilters,
  parseFields,
  parseIncludes
};