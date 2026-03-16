import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain, ValidationError } from 'express-validator';
import { HTTP_STATUS } from '../config/constants';

// Custom type for formatted validation error
interface FormattedValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Type guards for different ValidationError types
 */
function isFieldValidationError(error: ValidationError): error is Extract<ValidationError, { type: 'field' }> {
  return error.type === 'field';
}

function isAlternativeValidationError(error: ValidationError): error is Extract<ValidationError, { type: 'alternative' }> {
  return error.type === 'alternative';
}

function isGroupedAlternativeValidationError(error: ValidationError): error is Extract<ValidationError, { type: 'alternative_grouped' }> {
  return error.type === 'alternative_grouped';
}

function isUnknownFieldsError(error: ValidationError): error is Extract<ValidationError, { type: 'unknown_fields' }> {
  return error.type === 'unknown_fields';
}

/**
 * Extract field name from validation error
 */
function getFieldFromError(error: ValidationError): string {
  if (isFieldValidationError(error)) {
    return error.path;
  }
  
  if (isAlternativeValidationError(error)) {
    // For alternative errors, try to get field from nested errors
    if (error.nestedErrors && error.nestedErrors.length > 0) {
      const firstNested = error.nestedErrors[0];
      return getFieldFromError(firstNested);
    }
    return 'alternative';
  }
  
  if (isGroupedAlternativeValidationError(error)) {
    // For grouped alternatives, try to get field from nested errors
    if (error.nestedErrors && error.nestedErrors.length > 0) {
      const firstGroup = error.nestedErrors[0];
      if (firstGroup.length > 0) {
        return getFieldFromError(firstGroup[0]);
      }
    }
    return 'alternative_grouped';
  }
  
  if (isUnknownFieldsError(error)) {
    // UnknownFieldsError doesn't have a path property
    // It contains information about fields that weren't expected
    return 'unknown_fields';
  }
  
  return 'unknown';
}

/**
 * Extract value from validation error if available
 */
function getValueFromError(error: ValidationError): any | undefined {
  if (isFieldValidationError(error)) {
    return error.value;
  }
  
  if (isAlternativeValidationError(error)) {
    // Try to get value from nested errors
    if (error.nestedErrors && error.nestedErrors.length > 0) {
      return getValueFromError(error.nestedErrors[0]);
    }
  }
  
  if (isGroupedAlternativeValidationError(error)) {
    // Try to get value from nested errors
    if (error.nestedErrors && error.nestedErrors.length > 0) {
      const firstGroup = error.nestedErrors[0];
      if (firstGroup.length > 0) {
        return getValueFromError(firstGroup[0]);
      }
    }
  }
  
  return undefined;
}

/**
 * Format validation errors from express-validator
 */
function formatExpressValidatorErrors(errors: ValidationError[]): FormattedValidationError[] {
  return errors.map(error => {
    const formattedError: FormattedValidationError = {
      field: getFieldFromError(error),
      message: error.msg,
    };
    
    // Add value if it exists
    const value = getValueFromError(error);
    if (value !== undefined) {
      formattedError.value = value;
    }
    
    return formattedError;
  });
}

/**
 * Validation middleware
 * Checks for validation errors and returns formatted response
 */
export const validate = (req: Request, res: Response, next: NextFunction): Response | void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      errors: formatExpressValidatorErrors(errors.array())
    });
  }
  
  next();
};

/**
 * Validate request body against schema (Joi or similar)
 */
export const validateBody = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const formattedErrors = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Validation failed',
        errors: formattedErrors
      });
    }
    
    next();
  };
};

/**
 * Validate request query parameters
 */
export const validateQuery = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const { error } = schema.validate(req.query);
    
    if (error) {
      const formattedErrors = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid query parameters',
        errors: formattedErrors
      });
    }
    
    next();
  };
};

/**
 * Validate request params
 */
export const validateParams = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const { error } = schema.validate(req.params);
    
    if (error) {
      const formattedErrors = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid parameters',
        errors: formattedErrors
      });
    }
    
    next();
  };
};

/**
 * Custom validation chain runner
 */
export const validateChain = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      await Promise.all(validations.map(validation => validation.run(req)));
      
      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }

      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Validation failed',
        errors: formatExpressValidatorErrors(errors.array())
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Validation process failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
};

/**
 * Sanitize request body
 */
export const sanitizeBody = (fields: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      fields.forEach(field => {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = req.body[field].trim();
        }
      });
      next();
    } catch (error) {
      return next(error);
    }
  };
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 */
export const isValidPhone = (phone: string): boolean => {
  if (typeof phone !== 'string') return false;
  const phoneRegex = /^\+?[1-9]\d{7,14}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  if (typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate date string
 */
export const isValidDate = (date: string): boolean => {
  if (typeof date !== 'string') return false;
  const timestamp = Date.parse(date);
  return !isNaN(timestamp);
};

/**
 * Validate password strength
 */
export const isStrongPassword = (password: string): boolean => {
  if (typeof password !== 'string') return false;
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Custom validator factory for common validations
 */
export const validators = {
  email: (value: string) => isValidEmail(value),
  phone: (value: string) => isValidPhone(value),
  url: (value: string) => isValidUrl(value),
  date: (value: string) => isValidDate(value),
  strongPassword: (value: string) => isStrongPassword(value),
  
  minLength: (min: number) => (value: string) => value.length >= min,
  maxLength: (max: number) => (value: string) => value.length <= max,
  matches: (pattern: RegExp) => (value: string) => pattern.test(value),
  isIn: (allowedValues: any[]) => (value: any) => allowedValues.includes(value),
};