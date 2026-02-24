import { DATE_FORMATS } from '../../config/constants';

/**
 * Format date to string
 */
export const formatDate = (
  date: Date | string | number,
  format: string = DATE_FORMATS.DEFAULT
): string => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date');
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year.toString())
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * Get start of day
 */
export const startOfDay = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get end of day
 */
export const endOfDay = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Get start of week (Sunday)
 */
export const startOfWeek = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return startOfDay(d);
};

/**
 * Get end of week (Saturday)
 */
export const endOfWeek = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day));
  return endOfDay(d);
};

/**
 * Get start of month
 */
export const startOfMonth = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setDate(1);
  return startOfDay(d);
};

/**
 * Get end of month
 */
export const endOfMonth = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return endOfDay(d);
};

/**
 * Get start of quarter
 */
export const startOfQuarter = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const quarter = Math.floor(d.getMonth() / 3);
  d.setMonth(quarter * 3, 1);
  return startOfDay(d);
};

/**
 * Get end of quarter
 */
export const endOfQuarter = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const quarter = Math.floor(d.getMonth() / 3);
  d.setMonth(quarter * 3 + 3, 0);
  return endOfDay(d);
};

/**
 * Get start of year
 */
export const startOfYear = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setMonth(0, 1);
  return startOfDay(d);
};

/**
 * Get end of year
 */
export const endOfYear = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setMonth(11, 31);
  return endOfDay(d);
};

/**
 * Add days to date
 */
export const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Add months to date
 */
export const addMonths = (date: Date, months: number): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

/**
 * Add years to date
 */
export const addYears = (date: Date, years: number): Date => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
};

/**
 * Get difference in days
 */
export const diffInDays = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Get difference in hours
 */
export const diffInHours = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60));
};

/**
 * Get difference in minutes
 */
export const diffInMinutes = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60));
};

/**
 * Check if date is between two dates
 */
export const isBetween = (date: Date, start: Date, end: Date): boolean => {
  return date >= start && date <= end;
};

/**
 * Get age from birthdate
 */
export const getAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
};

/**
 * Check if date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * Check if date is tomorrow
 */
export const isTomorrow = (date: Date): boolean => {
  const tomorrow = addDays(new Date(), 1);
  return date.toDateString() === tomorrow.toDateString();
};

/**
 * Check if date is yesterday
 */
export const isYesterday = (date: Date): boolean => {
  const yesterday = addDays(new Date(), -1);
  return date.toDateString() === yesterday.toDateString();
};

/**
 * Get business days between dates
 */
export const getBusinessDays = (start: Date, end: Date): number => {
  let count = 0;
  const curDate = new Date(start);
  
  while (curDate <= end) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  
  return count;
};