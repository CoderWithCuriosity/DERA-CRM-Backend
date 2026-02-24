import { Request, Response, NextFunction } from 'express';
import xss from 'xss';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';

/**
 * XSS protection middleware
 */
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
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

  next();
};

/**
 * SQL injection protection
 */
export const sqlInjectionProtection = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`SQL injection attempt detected on ${key}`);
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

  next();
};

/**
 * Remove whitespace
 */
export const trimWhitespace = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }

  next();
};

/**
 * Remove empty strings
 */
export const removeEmptyStrings = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (req.body[key] === '') {
        delete req.body[key];
      }
    });
  }

  next();
};

/**
 * Normalize email
 */
export const normalizeEmail = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && req.body.email) {
    req.body.email = req.body.email.toLowerCase().trim();
  }

  next();
};

/**
 * Sanitize phone number
 */
export const sanitizePhone = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && req.body.phone) {
    req.body.phone = req.body.phone.replace(/[^\d+]/g, '');
  }

  next();
};

/**
 * Convert string to number
 */
export const toNumber = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fields.forEach(field => {
      if (req.body && req.body[field] && !isNaN(req.body[field])) {
        req.body[field] = parseFloat(req.body[field]);
      }
      if (req.query && req.query[field] && !isNaN(req.query[field] as string)) {
        req.query[field] = parseFloat(req.query[field] as string);
      }
      if (req.params && req.params[field] && !isNaN(req.params[field])) {
        req.params[field] = parseFloat(req.params[field]);
      }
    });
    next();
  };
};

/**
 * Convert string to boolean
 */
export const toBoolean = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fields.forEach(field => {
      if (req.body && req.body[field] !== undefined) {
        req.body[field] = req.body[field] === 'true' || req.body[field] === true;
      }
      if (req.query && req.query[field] !== undefined) {
        req.query[field] = req.query[field] === 'true';
      }
    });
    next();
  };
};

/**
 * Convert string to date
 */
export const toDate = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fields.forEach(field => {
      if (req.body && req.body[field]) {
        req.body[field] = new Date(req.body[field]);
      }
      if (req.query && req.query[field]) {
        req.query[field] = new Date(req.query[field] as string);
      }
    });
    next();
  };
};

/**
 * Sanitize array
 */
export const sanitizeArray = (field: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
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
    next();
  };
};

/**
 * Sanitize object
 */
export const sanitizeObject = (field: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body && req.body[field] && typeof req.body[field] === 'string') {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch (error) {
        // Keep as is if not valid JSON
      }
    }
    next();
  };
};

/**
 * Remove HTML tags
 */
export const stripHtmlTags = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fields.forEach(field => {
      if (req.body && req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = req.body[field].replace(/<[^>]*>/g, '');
      }
    });
    next();
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
export const preventParameterPollution = (req: Request, res: Response, next: NextFunction) => {
  const singleParamFields = ['id', 'userId', 'contactId', 'dealId', 'ticketId'];
  
  singleParamFields.forEach(field => {
    if (req.query[field] && Array.isArray(req.query[field])) {
      req.query[field] = req.query[field][0];
    }
  });
  
  next();
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
  
  next();
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