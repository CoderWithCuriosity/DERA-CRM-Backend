/**
 * Custom error class for application errors
 */
class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;
  public errors?: any[];

  constructor(message: string, statusCode: number, errors?: any[]) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create bad request error (400)
   */
  static badRequest(message: string, errors?: any[]): AppError {
    return new AppError(message, 400, errors);
  }

  /**
   * Create unauthorized error (401)
   */
  static unauthorized(message: string = 'Unauthorized'): AppError {
    return new AppError(message, 401);
  }

  /**
   * Create forbidden error (403)
   */
  static forbidden(message: string = 'Forbidden'): AppError {
    return new AppError(message, 403);
  }

  /**
   * Create not found error (404)
   */
  static notFound(resource: string = 'Resource'): AppError {
    return new AppError(`${resource} not found`, 404);
  }

  /**
   * Create conflict error (409)
   */
  static conflict(message: string): AppError {
    return new AppError(message, 409);
  }

  /**
   * Create validation error (422)
   */
  static validation(errors: any[]): AppError {
    return new AppError('Validation failed', 422, errors);
  }

  /**
   * Create too many requests error (429)
   */
  static tooManyRequests(message: string = 'Too many requests'): AppError {
    return new AppError(message, 429);
  }

  /**
   * Create internal server error (500)
   */
  static internal(message: string = 'Internal server error'): AppError {
    return new AppError(message, 500);
  }

  /**
   * Convert to JSON for response
   */
  toJSON() {
    return {
      success: false,
      message: this.message,
      ...(this.errors && { errors: this.errors }),
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }
}

export default AppError;