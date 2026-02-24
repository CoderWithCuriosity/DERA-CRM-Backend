import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, RefreshToken } from '../models';
import { environment } from '../config/environment';
import AppError from '../utils/AppError';
import { HTTP_STATUS } from '../config/constants';

/**
 * Token payload interface
 */
export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  type?: 'access' | 'refresh' | 'verification' | 'reset';
}

/**
 * Generate JWT access token
 */
export const generateAccessToken = (user: User): string => {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'access'
  };

  return jwt.sign(payload, environment.jwtSecret, {
    expiresIn: environment.jwtExpire,
    issuer: 'dera-crm',
    audience: 'dera-crm-api'
  });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = async (userId: number): Promise<RefreshToken> => {
  // Revoke all existing refresh tokens for user
  await RefreshToken.update(
    { revoked: true },
    { where: { user_id: userId, revoked: false } }
  );

  // Create new refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  const refreshToken = await RefreshToken.create({
    user_id: userId,
    token: uuidv4(),
    expires_at: expiresAt,
    revoked: false
  });

  return refreshToken;
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, environment.jwtSecret, {
      issuer: 'dera-crm',
      audience: 'dera-crm-api'
    }) as TokenPayload;

    if (decoded.type !== 'access') {
      throw new AppError('Invalid token type', HTTP_STATUS.UNAUTHORIZED);
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid token', HTTP_STATUS.UNAUTHORIZED);
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Token expired', HTTP_STATUS.UNAUTHORIZED);
    }
    throw error;
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = async (token: string): Promise<TokenPayload> => {
  const refreshToken = await RefreshToken.findOne({
    where: { token, revoked: false },
    include: [{ model: User, as: 'user' }]
  });

  if (!refreshToken) {
    throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
  }

  if (refreshToken.isExpired()) {
    await refreshToken.update({ revoked: true });
    throw new AppError('Refresh token expired', HTTP_STATUS.UNAUTHORIZED);
  }

  const user = refreshToken.user;
  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.UNAUTHORIZED);
  }

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'refresh'
  };
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
  const payload = await verifyRefreshToken(refreshToken);
  
  const user = await User.findByPk(payload.userId);
  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.UNAUTHORIZED);
  }

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = await generateRefreshToken(user.id);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken.token
  };
};

/**
 * Revoke refresh token
 */
export const revokeRefreshToken = async (token: string): Promise<void> => {
  await RefreshToken.update(
    { revoked: true },
    { where: { token } }
  );
};

/**
 * Revoke all user refresh tokens
 */
export const revokeAllUserTokens = async (userId: number): Promise<void> => {
  await RefreshToken.update(
    { revoked: true },
    { where: { user_id: userId, revoked: false } }
  );
};

/**
 * Generate email verification token
 */
export const generateVerificationToken = (user: User): string => {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'verification'
  };

  return jwt.sign(payload, environment.jwtSecret, {
    expiresIn: '24h',
    issuer: 'dera-crm',
    audience: 'dera-crm-api'
  });
};

/**
 * Verify email verification token
 */
export const verifyVerificationToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, environment.jwtSecret, {
      issuer: 'dera-crm',
      audience: 'dera-crm-api'
    }) as TokenPayload;

    if (decoded.type !== 'verification') {
      throw new AppError('Invalid token type', HTTP_STATUS.UNAUTHORIZED);
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid verification token', HTTP_STATUS.UNAUTHORIZED);
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Verification token expired', HTTP_STATUS.UNAUTHORIZED);
    }
    throw error;
  }
};

/**
 * Generate password reset token
 */
export const generatePasswordResetToken = (user: User): string => {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'reset'
  };

  return jwt.sign(payload, environment.jwtSecret, {
    expiresIn: '1h',
    issuer: 'dera-crm',
    audience: 'dera-crm-api'
  });
};

/**
 * Verify password reset token
 */
export const verifyPasswordResetToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, environment.jwtSecret, {
      issuer: 'dera-crm',
      audience: 'dera-crm-api'
    }) as TokenPayload;

    if (decoded.type !== 'reset') {
      throw new AppError('Invalid token type', HTTP_STATUS.UNAUTHORIZED);
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid reset token', HTTP_STATUS.UNAUTHORIZED);
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Reset token expired', HTTP_STATUS.UNAUTHORIZED);
    }
    throw error;
  }
};

/**
 * Generate API key
 */
export const generateApiKey = (): string => {
  return `dera_${uuidv4().replace(/-/g, '')}`;
};

/**
 * Generate random token
 */
export const generateRandomToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * Decode token without verification
 */
export const decodeToken = (token: string): any => {
  return jwt.decode(token);
};

/**
 * Get token expiration time
 */
export const getTokenExpiration = (token: string): Date | null => {
  const decoded = decodeToken(token);
  if (decoded && decoded.exp) {
    return new Date(decoded.exp * 1000);
  }
  return null;
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const expiration = getTokenExpiration(token);
  return expiration ? expiration < new Date() : true;
};