/**
 * Pick specific keys from object
 */
export const pick = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: readonly K[]
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
export const omit = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: readonly K[]
): Omit<T, K> => {
  const result = { ...obj } as T;
  keys.forEach(key => {
    delete result[key];
  });
  return result as Omit<T, K>;
};

/**
 * Check if object has key
 */
export const hasKey = <T extends Record<string, unknown>>(
  obj: T,
  key: PropertyKey
): key is keyof T => {
  return key in obj;
};

/**
 * Get nested value from object
 */
export const get = <T, TDefault = undefined>(
  obj: Record<string, unknown>,
  path: string | readonly string[],
  defaultValue?: TDefault
): T | TDefault => {
  let keys: string[];
  
  if (typeof path === 'string') {
    keys = path.split('.');
  } else {
    keys = [...path];
  }
  
  let result: unknown = obj;

  for (const key of keys) {
    if (result == null || typeof result !== 'object' || !(key in result)) {
      return defaultValue as TDefault;
    }
    result = (result as Record<string, unknown>)[key];
  }

  return result as T;
};

/**
 * Set nested value in object
 */
export const set = <T extends Record<string, unknown>>(
  obj: T,
  path: string | readonly string[],
  value: unknown
): T => {
  if (typeof path === 'string') {
    path = path.split('.');
  }
  const keys = [...path] as string[];
  const lastKey = keys.pop();
  if (!lastKey) return obj;

  const target = get<Record<string, unknown>>(obj, keys);
  
  if (target && typeof target === 'object' && target !== null) {
    target[lastKey] = value;
  }

  return obj;
};

/**
 * Deep merge objects
 */
export const deepMerge = <T extends Record<string, unknown>>(
  target: T,
  source: Record<string, unknown>
): T => {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    (Object.keys(source) as Array<keyof typeof source>).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          (output as Record<string, unknown>)[key] = deepMerge(
            target[key] as Record<string, unknown>, 
            source[key] as Record<string, unknown>
          );
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
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

/**
 * Check if object is empty
 */
export const isEmpty = <T extends Record<string, unknown>>(obj: T): boolean => {
  return Object.keys(obj).length === 0;
};

/**
 * Deep clone object
 */
export const deepClone = <T extends Record<string, unknown>>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Flatten object
 */
export const flatten = (
  obj: unknown,
  prefix: string = '',
  result: Record<string, unknown> = {}
): Record<string, unknown> => {
  if (isObject(obj)) {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        flatten(obj[key], prefix ? `${prefix}.${key}` : key, result);
      }
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
export const unflatten = <T extends Record<string, unknown>>(obj: T): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    
    const keys = key.split('.');
    let current: Record<string, unknown> = result;

    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const isLast = i === keys.length - 1;

      // Handle array indices
      const arrayMatch = /^(.*)\[(\d+)\]$/.exec(k);
      if (arrayMatch) {
        const [, arrayKey, indexStr] = arrayMatch;
        const index = parseInt(indexStr, 10);
        
        if (!current[arrayKey]) {
          current[arrayKey] = [];
        }
        const array = current[arrayKey] as unknown[];
        
        if (isLast) {
          array[index] = obj[key];
        } else {
          if (!array[index]) {
            array[index] = {};
          }
          current = array[index] as Record<string, unknown>;
        }
      } else {
        if (isLast) {
          current[k] = obj[key];
        } else {
          if (!current[k]) {
            current[k] = {};
          }
          current = current[k] as Record<string, unknown>;
        }
      }
    }
  }

  return result;
};

/**
 * Map object keys
 */
export const mapKeys = <T extends Record<string, unknown>>(
  obj: T,
  mapper: (key: string, value: T[keyof T]) => string
): Record<string, T[keyof T]> => {
  return (Object.keys(obj) as Array<keyof T>).reduce((result, key) => {
    const newKey = mapper(key as string, obj[key]);
    result[newKey] = obj[key];
    return result;
  }, {} as Record<string, T[keyof T]>);
};

/**
 * Map object values
 */
export const mapValues = <T extends Record<string, unknown>, R>(
  obj: T,
  mapper: (value: T[keyof T], key: keyof T) => R
): Record<keyof T, R> => {
  return (Object.keys(obj) as Array<keyof T>).reduce((result, key) => {
    result[key] = mapper(obj[key], key);
    return result;
  }, {} as Record<keyof T, R>);
};

/**
 * Filter object by predicate
 */
export const filter = <T extends Record<string, unknown>>(
  obj: T,
  predicate: <K extends keyof T>(value: T[K], key: K) => boolean
): Partial<T> => {
  return (Object.keys(obj) as Array<keyof T>).reduce((result, key) => {
    if (predicate(obj[key], key)) {
      result[key] = obj[key];
    }
    return result;
  }, {} as Partial<T>);
};

/**
 * Invert object keys and values (values become keys)
 */
export const invert = <T extends Record<string, string | number | symbol>>(
  obj: T
): { [K in string | number | symbol]: keyof T } => {
  return (Object.keys(obj) as Array<keyof T>).reduce((result, key) => {
    const value = obj[key];
    result[value] = key;
    return result;
  }, {} as { [K in string | number | symbol]: keyof T });
};

/**
 * Get object size (number of keys)
 */
export const size = <T extends Record<string, unknown>>(obj: T): number => {
  return Object.keys(obj).length;
};

/**
 * Compare two objects deeply
 */
export const isEqual = (obj1: unknown, obj2: unknown): boolean => {
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
    if (!isEqual(
      (obj1 as Record<string, unknown>)[key],
      (obj2 as Record<string, unknown>)[key]
    )) return false;
  }

  return true;
};

/**
 * Freeze object deeply
 */
export const deepFreeze = <T extends Record<string, unknown>>(obj: T): T => {
  Object.freeze(obj);
  
  (Object.keys(obj) as Array<keyof T>).forEach(key => {
    const value = obj[key];
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value as Record<string, unknown>);
    }
  });

  return obj;
};

/**
 * Seal object deeply
 */
export const deepSeal = <T extends Record<string, unknown>>(obj: T): T => {
  Object.seal(obj);
  
  (Object.keys(obj) as Array<keyof T>).forEach(key => {
    const value = obj[key];
    if (value && typeof value === 'object' && !Object.isSealed(value)) {
      deepSeal(value as Record<string, unknown>);
    }
  });

  return obj;
};

/**
 * Get object paths
 */
export const getPaths = (obj: unknown, prefix: string = ''): string[] => {
  if (!isObject(obj) && !Array.isArray(obj)) return prefix ? [prefix] : [];

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
  } else if (isObject(obj)) {
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
export const transform = <T extends Record<string, unknown>, R>(
  obj: T,
  transformer: <K extends keyof T>(acc: R, value: T[K], key: K) => R,
  initial: R
): R => {
  return (Object.keys(obj) as Array<keyof T>).reduce((acc, key) => {
    return transformer(acc, obj[key], key);
  }, initial);
};