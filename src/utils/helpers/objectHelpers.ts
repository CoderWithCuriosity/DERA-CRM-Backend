/**
 * Pick specific keys from object
 */
export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

/**
 * Omit specific keys from object
 */
export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj } as any;
  keys.forEach(key => {
    delete result[key];
  });
  return result;
};

/**
 * Check if object has key
 */
export const hasKey = <T extends object>(obj: T, key: keyof any): key is keyof T => {
  return key in obj;
};

/**
 * Get nested value from object
 */
export const get = <T, D = undefined>(
  obj: any,
  path: string | string[],
  defaultValue?: D
): T | D => {
  const keys = Array.isArray(path) ? path : path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result == null || !hasKey(result, key)) {
      return defaultValue as D;
    }
    result = result[key];
  }

  return result as T;
};

/**
 * Set nested value in object
 */
export const set = <T extends object>(
  obj: T,
  path: string | string[],
  value: any
): T => {
  const keys = Array.isArray(path) ? path : path.split('.');
  const lastKey = keys.pop()!;
  const target = get(obj, keys) as any;

  if (target && typeof target === 'object') {
    target[lastKey] = value;
  }

  return obj;
};

/**
 * Deep merge objects
 */
export const deepMerge = <T extends object>(target: T, source: any): T => {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
};

/**
 * Check if value is plain object
 */
export const isObject = (value: any): value is object => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj: object): boolean => {
  return Object.keys(obj).length === 0;
};

/**
 * Deep clone object
 */
export const deepClone = <T extends object>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Flatten object
 */
export const flatten = (
  obj: any,
  prefix: string = '',
  result: any = {}
): any => {
  if (isObject(obj)) {
    for (const key in obj) {
      flatten(obj[key], prefix ? `${prefix}.${key}` : key, result);
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      flatten(item, `${prefix}[${index}]`, result);
    });
  } else {
    result[prefix] = obj;
  }
  return result;
};

/**
 * Unflatten object
 */
export const unflatten = (obj: any): any => {
  const result: any = {};

  for (const key in obj) {
    const keys = key.split('.');
    let current = result;

    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const isLast = i === keys.length - 1;

      // Handle array indices
      const arrayMatch = k.match(/(.*)\[(\d+)\]/);
      if (arrayMatch) {
        const [, arrayKey, index] = arrayMatch;
        current[arrayKey] = current[arrayKey] || [];
        if (isLast) {
          current[arrayKey][index] = obj[key];
        } else {
          current[arrayKey][index] = current[arrayKey][index] || {};
          current = current[arrayKey][index];
        }
      } else {
        if (isLast) {
          current[k] = obj[key];
        } else {
          current[k] = current[k] || {};
          current = current[k];
        }
      }
    }
  }

  return result;
};

/**
 * Map object keys
 */
export const mapKeys = <T extends object>(
  obj: T,
  mapper: (key: string, value: any) => string
): any => {
  return Object.keys(obj).reduce((result, key) => {
    const newKey = mapper(key, obj[key]);
    result[newKey] = obj[key];
    return result;
  }, {} as any);
};

/**
 * Map object values
 */
export const mapValues = <T extends object, R>(
  obj: T,
  mapper: (value: any, key: string) => R
): { [K in keyof T]: R } => {
  return Object.keys(obj).reduce((result, key) => {
    result[key] = mapper(obj[key], key);
    return result;
  }, {} as any);
};

/**
 * Filter object by predicate
 */
export const filter = <T extends object>(
  obj: T,
  predicate: (value: any, key: string) => boolean
): Partial<T> => {
  return Object.keys(obj).reduce((result, key) => {
    if (predicate(obj[key], key)) {
      result[key] = obj[key];
    }
    return result;
  }, {} as any);
};

/**
 * Invert object keys and values
 */
export const invert = <T extends object>(obj: T): { [K in keyof T as T[K] extends string ? T[K] : never]: K } => {
  return Object.keys(obj).reduce((result, key) => {
    const value = obj[key];
    if (typeof value === 'string' || typeof value === 'number') {
      result[value] = key;
    }
    return result;
  }, {} as any);
};

/**
 * Get object size (number of keys)
 */
export const size = (obj: object): number => {
  return Object.keys(obj).length;
};

/**
 * Compare two objects deeply
 */
export const isEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  
  if (typeof obj1 !== 'object' || obj1 === null ||
      typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!isEqual(obj1[key], obj2[key])) return false;
  }

  return true;
};

/**
 * Freeze object deeply
 */
export const deepFreeze = <T extends object>(obj: T): T => {
  Object.freeze(obj);
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  });

  return obj;
};

/**
 * Seal object deeply
 */
export const deepSeal = <T extends object>(obj: T): T => {
  Object.seal(obj);
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value && typeof value === 'object' && !Object.isSealed(value)) {
      deepSeal(value);
    }
  });

  return obj;
};

/**
 * Get object paths
 */
export const getPaths = (obj: any, prefix: string = ''): string[] => {
  if (!isObject(obj) && !Array.isArray(obj)) return [prefix];

  const paths: string[] = [];

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const newPrefix = prefix ? `${prefix}[${index}]` : `[${index}]`;
      if (isObject(item) || Array.isArray(item)) {
        paths.push(...getPaths(item, newPrefix));
      } else {
        paths.push(newPrefix);
      }
    });
  } else {
    Object.keys(obj).forEach(key => {
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      if (isObject(obj[key]) || Array.isArray(obj[key])) {
        paths.push(...getPaths(obj[key], newPrefix));
      } else {
        paths.push(newPrefix);
      }
    });
  }

  return paths;
};

/**
 * Transform object with custom transformer
 */
export const transform = <T extends object, R>(
  obj: T,
  transformer: (acc: any, value: any, key: string) => any,
  initial: any = {}
): R => {
  return Object.keys(obj).reduce((acc, key) => {
    return transformer(acc, obj[key], key);
  }, initial);
};