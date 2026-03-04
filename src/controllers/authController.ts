import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { User, RefreshToken, PasswordReset, AuditLog } from '../models';
import { environment, email as emailConfig } from '../config/environment';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES, AUDIT_ACTIONS, ENTITY_TYPES } from '../config/constants';
import catchAsync from '../utils/catchAsync';
import { sendEmail } from '../services/emailService';
import { generateAccessToken , generateRefreshToken, verifyRefreshToken } from '../services/tokenService';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = catchAsync(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_FAILED,
      errors: errors.array()
    });
  }

  const { email, password, first_name, last_name } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: ERROR_MESSAGES.CONFLICT('Email')
    });
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

  // Generate verification token
  const verificationToken = jwt.sign(
    { userId: user.id, email: user.email },
    environment.jwtSecret,
    { expiresIn: '24h' }
  );

  // Send verification email
  const verificationUrl = `${environment.frontendUrl}/verify-email?token=${verificationToken}`;
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

  // Generate auth token
  const token = generateAccessToken (user);
  const refreshToken = await generateRefreshToken(user.id);

  // Log audit
  await AuditLog.create({
    user_id: user.id,
    action: AUDIT_ACTIONS.CREATE,
    entity_type: ENTITY_TYPES.USER,
    entity_id: user.id,
    details: `User registered: ${user.email}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: SUCCESS_MESSAGES.REGISTER_SUCCESS,
    data: {
      user: user.toJSON(),
      token,
      refreshToken: refreshToken.token
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = catchAsync(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_FAILED,
      errors: errors.array()
    });
  }

  const { email, password } = req.body;

  // Find user
  const user = await User.findOne({ 
    where: { email },
    include: ['organization']
  });

  if (!user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.INVALID_CREDENTIALS
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.INVALID_CREDENTIALS
    });
  }

  // Check if verified
  if (!user.is_verified) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.ACCOUNT_NOT_VERIFIED
    });
  }

  // Update last login
  await user.updateLastLogin();

  // Generate tokens
  const token = generateAccessToken (user);
  const refreshToken = await generateRefreshToken(user.id);

  // Log audit
  await AuditLog.create({
    user_id: user.id,
    action: AUDIT_ACTIONS.LOGIN,
    entity_type: ENTITY_TYPES.USER,
    entity_id: user.id,
    details: `User logged in`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
    data: {
      user: user.toJSON(),
      token,
      refreshToken: refreshToken.token
    }
  });
});

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  const payload = await verifyRefreshToken(refresh_token);
  if (!payload) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }

  const user = await User.findByPk(payload.userId);
  if (!user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not found'
    });
  }

  const token = generateAccessToken (user);
  const newRefreshToken = await generateRefreshToken(user.id);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      token,
      refreshToken: newRefreshToken.token
    }
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = catchAsync(async (req: Request, res: Response) => {
  const { refresh_token } = req.body;

  if (refresh_token) {
    await RefreshToken.update(
      { revoked: true },
      { where: { token: refresh_token } }
    );
  }

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.LOGOUT,
    entity_type: ENTITY_TYPES.USER,
    entity_id: req.user.id,
    details: `User logged out`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.LOGOUT_SUCCESS
  });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.params;

  try {
    const decoded: any = jwt.verify(token, environment.jwtSecret);

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.NOT_FOUND('User')
      });
    }

    if (user.is_verified) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Email already verified'
      });
    }

    await user.update({ is_verified: true });

    // Log audit
    await AuditLog.create({
      user_id: user.id,
      action: AUDIT_ACTIONS.UPDATE,
      entity_type: ENTITY_TYPES.USER,
      entity_id: user.id,
      details: `Email verified`,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.EMAIL_VERIFIED
    });
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.INVALID_TOKEN
    });
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.PASSWORD_RESET_EMAIL_SENT
    });
  }

  // Create password reset token
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  const passwordReset = await PasswordReset.create({
    user_id: user.id,
    expires_at: expiresAt
  });

  // Send reset email
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

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.PASSWORD_RESET_EMAIL_SENT
  });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  const passwordReset = await PasswordReset.findOne({
    where: { token, used: false },
    include: ['user']
  });

  if (!passwordReset || !passwordReset.isValid()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.INVALID_TOKEN
    });
  }

 // Fetch the user separately
  const user = await User.findByPk(passwordReset.user_id);

  if (!user) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.INVALID_TOKEN
    });
  }

  // Update password
  user.password = password; // Assuming pre-save hook handles hashing
  await user.save();

  // Mark token as used
  await passwordReset.update({ used: true });

  // Revoke all refresh tokens
  await RefreshToken.update(
    { revoked: true },
    { where: { user_id: user.id } }
  );

  // Log audit
  await AuditLog.create({
    user_id: user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity_type: ENTITY_TYPES.USER,
    entity_id: user.id,
    details: `Password reset`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS
  });
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerification = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.EMAIL_VERIFIED
    });
  }

  if (user.is_verified) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Email already verified'
    });
  }

  // Generate new verification token
  const verificationToken = jwt.sign(
    { userId: user.id, email: user.email },
    environment.jwtSecret,
    { expiresIn: '24h' }
  );

  // Send verification email
  const verificationUrl = `${environment.frontendUrl}/verify-email?token=${verificationToken}`;
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

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Verification email resent successfully'
  });
});