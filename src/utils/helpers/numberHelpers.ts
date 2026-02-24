/**
 * Format number as currency
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount);
};

/**
 * Format number as percentage
 */
export const formatPercentage = (
  value: number,
  decimals: number = 2
): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format number with commas
 */
export const formatNumber = (
  value: number,
  decimals: number = 0
): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Round to decimal places
 */
export const roundTo = (value: number, decimals: number = 2): number => {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (
  value: number,
  total: number,
  decimals: number = 2
): number => {
  if (total === 0) return 0;
  return roundTo((value / total) * 100, decimals);
};

/**
 * Calculate weighted value
 */
export const calculateWeightedValue = (
  amount: number,
  probability: number
): number => {
  return amount * (probability / 100);
};

/**
 * Generate random number between min and max
 */
export const randomBetween = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

/**
 * Generate random integer between min and max
 */
export const randomIntBetween = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Clamp number between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Check if number is within range
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * Sum array of numbers
 */
export const sum = (numbers: number[]): number => {
  return numbers.reduce((acc, curr) => acc + curr, 0);
};

/**
 * Average array of numbers
 */
export const average = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  return sum(numbers) / numbers.length;
};

/**
 * Median of numbers
 */
export const median = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  
  return sorted[middle];
};

/**
 * Mode of numbers
 */
export const mode = (numbers: number[]): number[] => {
  const frequency: { [key: number]: number } = {};
  let maxFreq = 0;
  
  numbers.forEach(num => {
    frequency[num] = (frequency[num] || 0) + 1;
    if (frequency[num] > maxFreq) {
      maxFreq = frequency[num];
    }
  });
  
  return Object.keys(frequency)
    .filter(key => frequency[parseInt(key)] === maxFreq)
    .map(key => parseInt(key));
};

/**
 * Format number to K/M/B
 */
export const formatCompact = (value: number): string => {
  if (value >= 1e9) {
    return (value / 1e9).toFixed(1) + 'B';
  }
  if (value >= 1e6) {
    return (value / 1e6).toFixed(1) + 'M';
  }
  if (value >= 1e3) {
    return (value / 1e3).toFixed(1) + 'K';
  }
  return value.toString();
};

/**
 * Parse number from string
 */
export const parseNumber = (value: string): number | null => {
  const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? null : parsed;
};

/**
 * Check if number is even
 */
export const isEven = (num: number): boolean => {
  return num % 2 === 0;
};

/**
 * Check if number is odd
 */
export const isOdd = (num: number): boolean => {
  return num % 2 !== 0;
};

/**
 * Get ordinal suffix (st, nd, rd, th)
 */
export const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;
  
  if (j === 1 && k !== 11) {
    return 'st';
  }
  if (j === 2 && k !== 12) {
    return 'nd';
  }
  if (j === 3 && k !== 13) {
    return 'rd';
  }
  return 'th';
};