import { Request, Response, NextFunction } from 'express';
import xss from 'xss';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';

/**
 * XSS protection middleware
 */
export const xssProtection = (req: Request, _res: Response, next: NextFunction) => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key].trim());
      }
    });
  }

  // Sanitize query
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = xss(req.query[key] as string);
      }
    });
  }

  // Sanitize params
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      if (typeof req.params[key] === 'string') {
        req.params[key] = xss(req.params[key]);
      }
    });
  }

  return next();
};

/**
 * SQL injection protection
 */
export const sqlInjectionProtection = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`SQL injection attempt detected on ${key} for request: ${req.method} ${req.url}`);
  }
});

/**
 * HTML sanitization
 */
export const sanitizeHtml = (req: Request, res: Response, next: NextFunction) => {
  const allowedTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'u', 'strike', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'pre', 'code'];
  const allowedAttributes = {
    a: ['href', 'title', 'target'],
    img: ['src', 'alt', 'title', 'width', 'height']
  };

  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string' && key.includes('html')) {
        req.body[key] = xss(req.body[key], {
          whiteList: allowedAttributes,
          stripIgnoreTag: true,
          stripIgnoreTagBody: ['script', 'style']
        });
      }
    });
  }

  return next();
};

/**
 * Remove whitespace
 */
export const trimWhitespace = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }

  return next();
};

/**
 * Remove empty strings
 */
export const removeEmptyStrings = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (req.body[key] === '') {
        delete req.body[key];
      }
    });
  }

  return next();
};

/**
 * Normalize email
 */
export const normalizeEmail = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && req.body.email) {
    req.body.email = req.body.email.toLowerCase().trim();
  }

  return next();
};

/**
 * Sanitize phone number
 */
export const sanitizePhone = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && req.body.phone) {
    req.body.phone = req.body.phone.replace(/[^\d+]/g, '');
  }

  return next();
};


/**
 * Convert string to number
 */
export const toNumber = (fields: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    fields.forEach(field => {
      if (req.body && req.body[field] && !isNaN(req.body[field])) {
        req.body[field] = parseFloat(req.body[field]);
      }
      
      // Fix: Convert to number first, then check if it's NaN
      if (req.query && req.query[field]) {
        const numValue = parseFloat(req.query[field] as string);
        if (!isNaN(numValue)) {
          (req.query as Record<string, string | number | boolean | Date>)[field] = numValue;
        }
      }
      
      // Fix: Same for params
      if (req.params && req.params[field]) {
        const numValue = parseFloat(req.params[field]);
        if (!isNaN(numValue)) {
          (req.params as Record<string, string | number | boolean | Date>)[field] = numValue;
        }
      }
    });
    return next();
  };
};

/**
 * Convert string to boolean
 */
export const toBoolean = (fields: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    fields.forEach(field => {
      if (req.body && req.body[field] !== undefined) {
        req.body[field] = req.body[field] === 'true' || req.body[field] === true;
      }
      if (req.query && req.query[field] !== undefined) {
        (req.query as Record<string, string | number | boolean | Date>)[field] = req.query[field] === 'true';
      }
    });
    return next();
  };
};

/**
 * Convert string to date
 */
export const toDate = (fields: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    fields.forEach(field => {
      if (req.body && req.body[field]) {
        req.body[field] = new Date(req.body[field]);
      }
      if (req.query && req.query[field]) {
        (req.query as Record<string, string | number | boolean | Date>)[field] = new Date(req.query[field] as string);
      }
    });
    return next();
  };
};

/**
 * Sanitize array
 */
export const sanitizeArray = (field: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.body && req.body[field]) {
      if (typeof req.body[field] === 'string') {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch {
          req.body[field] = req.body[field].split(',').map((item: string) => item.trim());
        }
      }
      if (!Array.isArray(req.body[field])) {
        req.body[field] = [req.body[field]];
      }
    }
    return next();
  };
};

/**
 * Sanitize object
 */
export const sanitizeObject = (field: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.body && req.body[field] && typeof req.body[field] === 'string') {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch (error) {
        // Keep as is if not valid JSON
      }
    }
    return next();
  };
};

/**
 * Remove HTML tags
 */
export const stripHtmlTags = (fields: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    fields.forEach(field => {
      if (req.body && req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = req.body[field].replace(/<[^>]*>/g, '');
      }
    });
    return next();
  };
};

/**
 * Security headers middleware using helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

/**
 * Prevent parameter pollution
 */
export const preventParameterPollution = (req: Request, _res: Response, next: NextFunction) => {
  const singleParamFields = ['id', 'userId', 'contactId', 'dealId', 'ticketId'];
  
  singleParamFields.forEach(field => {
    if (req.query[field] && Array.isArray(req.query[field])) {
      req.query[field] = req.query[field][0];
    }
  });
  
  return next();
};

/**
 * Validate content type
 */
export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
  const allowedMethods = ['POST', 'PUT', 'PATCH'];
  
  if (allowedMethods.includes(req.method) && !req.is('application/json')) {
    return res.status(415).json({
      success: false,
      message: 'Content-Type must be application/json'
    });
  }
  
  return next();
};

export default {
  xssProtection,
  sqlInjectionProtection,
  sanitizeHtml,
  trimWhitespace,
  removeEmptyStrings,
  normalizeEmail,
  sanitizePhone,
  toNumber,
  toBoolean,
  toDate,
  sanitizeArray,
  sanitizeObject,
  stripHtmlTags,
  securityHeaders,
  preventParameterPollution,
  validateContentType
};