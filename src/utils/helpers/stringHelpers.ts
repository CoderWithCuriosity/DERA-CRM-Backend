/**
 * Capitalize first letter of string
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Capitalize each word in string
 */
export const capitalizeWords = (str: string): string => {
  if (!str) return '';
  return str.split(' ').map(word => capitalize(word)).join(' ');
};

/**
 * Truncate string to length
 */
export const truncate = (str: string, length: number, suffix: string = '...'): string => {
  if (!str || str.length <= length) return str;
  return str.substring(0, length) + suffix;
};

/**
 * Generate slug from string
 */
export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Generate random string
 */
export const randomString = (length: number = 10): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate random alphanumeric string
 */
export const randomAlphanumeric = (length: number = 10): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate random numeric string
 */
export const randomNumeric = (length: number = 6): string => {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Check if string is email
 */
export const isEmail = (str: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
};

/**
 * Check if string is URL
 */
export const isURL = (str: string): boolean => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if string is phone number
 */
export const isPhone = (str: string): boolean => {
  const phoneRegex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(str);
};

/**
 * Extract email from string
 */
export const extractEmail = (str: string): string | null => {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = str.match(emailRegex);
  return match ? match[0] : null;
};

/**
 * Extract URLs from string
 */
export const extractURLs = (str: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return str.match(urlRegex) || [];
};

/**
 * Mask email
 */
export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  
  const maskedLocal = local.length > 2
    ? local.substring(0, 2) + '*'.repeat(local.length - 2)
    : local;
  
  return `${maskedLocal}@${domain}`;
};

/**
 * Mask phone number
 */
export const maskPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return phone;
  
  const last4 = cleaned.slice(-4);
  const masked = '*'.repeat(cleaned.length - 4) + last4;
  
  // Reinsert original formatting
  let result = '';
  let maskedIndex = 0;
  for (let i = 0; i < phone.length; i++) {
    if (/\d/.test(phone[i])) {
      result += masked[maskedIndex];
      maskedIndex++;
    } else {
      result += phone[i];
    }
  }
  
  return result;
};

/**
 * Remove HTML tags
 */
export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

/**
 * Escape HTML
 */
export const escapeHtml = (str: string): string => {
  const htmlEntities: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return str.replace(/[&<>"']/g, char => htmlEntities[char]);
};

/**
 * Unescape HTML
 */
export const unescapeHtml = (str: string): string => {
  const htmlEntities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'"
  };
  
  return str.replace(/&(amp|lt|gt|quot|#39);/g, entity => htmlEntities[entity]);
};

/**
 * Truncate HTML (preserve tags)
 */
export const truncateHtml = (html: string, length: number): string => {
  const text = stripHtml(html);
  if (text.length <= length) return html;
  
  const truncated = text.substring(0, length) + '...';
  return truncated;
};

/**
 * Convert to camelCase
 */
export const toCamelCase = (str: string): string => {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, chr => chr.toLowerCase());
};

/**
 * Convert to snake_case
 */
export const toSnakeCase = (str: string): string => {
  return str
    .replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    .replace(/^_/, '')
    .replace(/[-\s]/g, '_');
};

/**
 * Convert to kebab-case
 */
export const toKebabCase = (str: string): string => {
  return str
    .replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
    .replace(/^_/, '')
    .replace(/[_\s]/g, '-');
};

/**
 * Convert to PascalCase
 */
export const toPascalCase = (str: string): string => {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
};

/**
 * Check if string contains only letters
 */
export const isAlpha = (str: string): boolean => {
  return /^[a-zA-Z]+$/.test(str);
};

/**
 * Check if string contains only alphanumeric
 */
export const isAlphanumeric = (str: string): boolean => {
  return /^[a-zA-Z0-9]+$/.test(str);
};

/**
 * Check if string contains only numbers
 */
export const isNumeric = (str: string): boolean => {
  return /^\d+$/.test(str);
};

/**
 * Get string byte size
 */
export const getByteSize = (str: string): number => {
  return new Blob([str]).size;
};

/**
 * Reverse string
 */
export const reverse = (str: string): string => {
  return str.split('').reverse().join('');
};

/**
 * Count words
 */
export const countWords = (str: string): number => {
  return str.trim().split(/\s+/).filter(word => word.length > 0).length;
};

/**
 * Count characters (excluding spaces)
 */
export const countChars = (str: string): number => {
  return str.replace(/\s/g, '').length;
};

/**
 * Pad string to length
 */
export const pad = (str: string, length: number, char: string = ' '): string => {
  if (str.length >= length) return str;
  const padding = char.repeat(length - str.length);
  return padding + str;
};

/**
 * Pad string to length (end)
 */
export const padEnd = (str: string, length: number, char: string = ' '): string => {
  if (str.length >= length) return str;
  return str + char.repeat(length - str.length);
};

/**
 * Extract initials from name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

/**
 * Pluralize word based on count
 */
export const pluralize = (count: number, singular: string, plural?: string): string => {
  if (count === 1) return singular;
  return plural || singular + 's';
};