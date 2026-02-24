/**
 * Chunk array into smaller arrays
 */
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Remove duplicates from array
 */
export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

/**
 * Get intersection of arrays
 */
export const intersection = <T>(...arrays: T[][]): T[] => {
  if (arrays.length === 0) return [];
  return arrays.reduce((acc, curr) => 
    acc.filter(item => curr.includes(item))
  );
};

/**
 * Get difference of arrays
 */
export const difference = <T>(array1: T[], array2: T[]): T[] => {
  return array1.filter(item => !array2.includes(item));
};

/**
 * Get union of arrays
 */
export const union = <T>(...arrays: T[][]): T[] => {
  return unique(arrays.flat());
};

/**
 * Group array by key
 */
export const groupBy = <T>(array: T[], key: keyof T): { [key: string]: T[] } => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    result[groupKey] = result[groupKey] || [];
    result[groupKey].push(item);
    return result;
  }, {} as { [key: string]: T[] });
};

/**
 * Sort array by key
 */
export const sortBy = <T>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Sort array by multiple keys
 */
export const sortByMultiple = <T>(
  array: T[],
  keys: Array<{ key: keyof T; order?: 'asc' | 'desc' }>
): T[] => {
  return [...array].sort((a, b) => {
    for (const { key, order = 'asc' } of keys) {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

/**
 * Flatten nested arrays
 */
export const flatten = <T>(array: any[]): T[] => {
  return array.reduce((acc, val) => 
    Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val), []
  );
};

/**
 * Get random item from array
 */
export const random = <T>(array: T[]): T | undefined => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Shuffle array
 */
export const shuffle = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Get first item of array
 */
export const first = <T>(array: T[]): T | undefined => {
  return array[0];
};

/**
 * Get last item of array
 */
export const last = <T>(array: T[]): T | undefined => {
  return array[array.length - 1];
};

/**
 * Get items at index
 */
export const at = <T>(array: T[], index: number): T | undefined => {
  return index >= 0 ? array[index] : array[array.length + index];
};

/**
 * Remove item from array
 */
export const remove = <T>(array: T[], item: T): T[] => {
  const index = array.indexOf(item);
  if (index > -1) {
    return [...array.slice(0, index), ...array.slice(index + 1)];
  }
  return array;
};

/**
 * Remove items by predicate
 */
export const removeBy = <T>(array: T[], predicate: (item: T) => boolean): T[] => {
  return array.filter(item => !predicate(item));
};

/**
 * Replace item in array
 */
export const replace = <T>(array: T[], index: number, item: T): T[] => {
  return [...array.slice(0, index), item, ...array.slice(index + 1)];
};

/**
 * Move item in array
 */
export const move = <T>(array: T[], from: number, to: number): T[] => {
  const result = [...array];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
};

/**
 * Split array into two based on predicate
 */
export const partition = <T>(
  array: T[],
  predicate: (item: T) => boolean
): [T[], T[]] => {
  return array.reduce(
    (result, item) => {
      result[predicate(item) ? 0 : 1].push(item);
      return result;
    },
    [[], []] as [T[], T[]]
  );
};

/**
 * Get count of items matching predicate
 */
export const countBy = <T>(array: T[], predicate: (item: T) => boolean): number => {
  return array.filter(predicate).length;
};

/**
 * Check if array contains item
 */
export const contains = <T>(array: T[], item: T): boolean => {
  return array.includes(item);
};

/**
 * Check if array contains any of items
 */
export const containsAny = <T>(array: T[], items: T[]): boolean => {
  return items.some(item => array.includes(item));
};

/**
 * Check if array contains all items
 */
export const containsAll = <T>(array: T[], items: T[]): boolean => {
  return items.every(item => array.includes(item));
};

/**
 * Get min value from array
 */
export const min = (array: number[]): number => {
  return Math.min(...array);
};

/**
 * Get max value from array
 */
export const max = (array: number[]): number => {
  return Math.max(...array);
};

/**
 * Get sum of array
 */
export const sum = (array: number[]): number => {
  return array.reduce((acc, val) => acc + val, 0);
};

/**
 * Get average of array
 */
export const average = (array: number[]): number => {
  if (array.length === 0) return 0;
  return sum(array) / array.length;
};

/**
 * Zip multiple arrays
 */
export const zip = <T>(...arrays: T[][]): T[][] => {
  const maxLength = Math.max(...arrays.map(arr => arr.length));
  return Array.from({ length: maxLength }, (_, i) => 
    arrays.map(arr => arr[i])
  );
};

/**
 * Unzip array of pairs
 */
export const unzip = <T>(pairs: T[][]): T[][] => {
  return pairs.reduce(
    (result, pair) => {
      pair.forEach((value, index) => {
        result[index] = result[index] || [];
        result[index].push(value);
      });
      return result;
    },
    [] as T[][]
  );
};

/**
 * Rotate array
 */
export const rotate = <T>(array: T[], steps: number): T[] => {
  const result = [...array];
  for (let i = 0; i < Math.abs(steps); i++) {
    if (steps > 0) {
      result.unshift(result.pop()!);
    } else {
      result.push(result.shift()!);
    }
  }
  return result;
};

/**
 * Get combinations of array
 */
export const combinations = <T>(array: T[], size: number): T[][] => {
  if (size === 0) return [[]];
  if (size > array.length) return [];
  
  const result: T[][] = [];
  
  const combine = (start: number, current: T[]) => {
    if (current.length === size) {
      result.push([...current]);
      return;
    }
    
    for (let i = start; i < array.length; i++) {
      current.push(array[i]);
      combine(i + 1, current);
      current.pop();
    }
  };
  
  combine(0, []);
  return result;
};