import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, RefreshToken, PasswordReset } from '../models';
import { environment } from '../config/environment';
import { sendEmail } from './emailService';
import AppError from '../utils/AppError';
import { HTTP_STATUS } from '../config/constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate JWT token
 */
export const generateToken = (user: User): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    environment.jwtSecret,
    { expiresIn: environment.jwtExpire }
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = async (userId: number): Promise<RefreshToken> => {
  // Revoke existing refresh tokens
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
 * Verify refresh token
 */
export const verifyRefreshToken = async (token: string): Promise<any> => {
  const refreshToken = await RefreshToken.findOne({
    where: { token, revoked: false },
    include: ['user']
  });

  if (!refreshToken) {
    throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
  }

  if (refreshToken.isExpired()) {
    await refreshToken.update({ revoked: true });
    throw new AppError('Refresh token expired', HTTP_STATUS.UNAUTHORIZED);
  }

  return {
    userId: refreshToken.user_id,
    token: refreshToken.token
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
 * Hash password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(environment.bcryptRounds);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Generate email verification token
 */
export const generateVerificationToken = (user: User): string => {
  return jwt.sign(
    { userId: user.id, email: user.email },
    environment.jwtSecret,
    { expiresIn: '24h' }
  );
};

/**
 * Send verification email
 */
export const sendVerificationEmail = async (user: User): Promise<void> => {
  const token = generateVerificationToken(user);
  const verificationUrl = `${environment.frontendUrl}/verify-email?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: 'Verify Your Email Address',
    template: 'verification',
    data: {
      first_name: user.first_name,
      verification_url: verificationUrl,
      company_name: 'DERA CRM'
    }
  });
};

/**
 * Generate password reset token
 */
export const generatePasswordResetToken = async (user: User): Promise<PasswordReset> => {
  // Invalidate existing tokens
  await PasswordReset.update(
    { used: true },
    { where: { user_id: user.id, used: false } }
  );

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  return PasswordReset.create({
    user_id: user.id,
    token: uuidv4(),
    expires_at: expiresAt,
    used: false
  });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (user: User): Promise<void> => {
  const passwordReset = await generatePasswordResetToken(user);
  const resetUrl = `${environment.frontendUrl}/reset-password?token=${passwordReset.token}`;

  await sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    template: 'passwordReset',
    data: {
      first_name: user.first_name,
      reset_url: resetUrl,
      company_name: 'DERA CRM',
      expires_in: '1 hour'
    }
  });
};

/**
 * Verify password reset token
 */
export const verifyPasswordResetToken = async (token: string): Promise<User> => {
  const passwordReset = await PasswordReset.findOne({
    where: { token, used: false },
    include: ['user']
  });

  if (!passwordReset || !passwordReset.isValid()) {
    throw new AppError('Invalid or expired token', HTTP_STATUS.BAD_REQUEST);
  }

  return passwordReset.user;
};

/**
 * Reset password with token
 */
export const resetPasswordWithToken = async (token: string, newPassword: string): Promise<void> => {
  const user = await verifyPasswordResetToken(token);
  
  user.password = newPassword;
  await user.save();

  // Mark token as used
  await PasswordReset.update(
    { used: true },
    { where: { token } }
  );

  // Revoke all refresh tokens
  await RefreshToken.update(
    { revoked: true },
    { where: { user_id: user.id } }
  );
};

/**
 * Change password
 */
export const changePassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) {
    throw new AppError('Current password is incorrect', HTTP_STATUS.UNAUTHORIZED);
  }

  user.password = newPassword;
  await user.save();

  // Revoke all refresh tokens
  await RefreshToken.update(
    { revoked: true },
    { where: { user_id: userId } }
  );
};

/**
 * Register new user
 */
export const registerUser = async (userData: any): Promise<{ user: User; token: string; refreshToken: string }> => {
  const { email, password, first_name, last_name } = userData;

  // Check if user exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new AppError('Email already registered', HTTP_STATUS.CONFLICT);
  }

  // Create user
  const user = await User.create({
    email,
    password,
    first_name,
    last_name,
    role: 'agent',
    is_verified: false
  });

  // Send verification email
  await sendVerificationEmail(user);

  // Generate tokens
  const token = generateToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  return {
    user,
    token,
    refreshToken: refreshToken.token
  };
};

/**
 * Login user
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<{ user: User; token: string; refreshToken: string }> => {
  const user = await User.findOne({
    where: { email },
    include: ['organization']
  });

  if (!user) {
    throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
  }

  if (!user.is_verified) {
    throw new AppError('Please verify your email first', HTTP_STATUS.UNAUTHORIZED);
  }

  // Update last login
  await user.updateLastLogin();

  // Generate tokens
  const token = generateToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  return {
    user,
    token,
    refreshToken: refreshToken.token
  };
};