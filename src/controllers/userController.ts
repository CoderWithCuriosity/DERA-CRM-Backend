import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize'; // Add this import
import { User, AuditLog, Contact, Deal, Ticket, Activity } from '../models'; // Add Activity import
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES, USER_ROLES, AUDIT_ACTIONS, ENTITY_TYPES } from '../config/constants';
import catchAsync from '../utils/catchAsync';
import { getPagination, getPagingData } from '../utils/pagination';
import { deleteFile } from '../config/fileUpload';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Check if user is authenticated
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password'] },
    include: ['organization']
  });

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('User')
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_FAILED,
      errors: errors.array()
    });
  }

  // Check if user is authenticated
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const { first_name, last_name, email } = req.body;

  const user = await User.findByPk(req.user.id);

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('User')
    });
  }

  // Check if email is being changed and if it's already taken
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: ERROR_MESSAGES.CONFLICT('Email')
      });
    }
  }

  await user.update({
    first_name: first_name || user.first_name,
    last_name: last_name || user.last_name,
    email: email || user.email
  });

  // Log audit
  await AuditLog.create({
    user_id: user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity_type: ENTITY_TYPES.USER,
    entity_id: user.id,
    details: `Profile updated`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.PROFILE_UPDATED,
    data: user.toJSON()
  });
});

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
export const changePassword = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_FAILED,
      errors: errors.array()
    });
  }

  // Check if user is authenticated
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const { current_password, new_password } = req.body;

  const user = await User.findByPk(req.user.id);

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('User')
    });
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(current_password);
  if (!isPasswordValid) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = new_password;
  await user.save();

  // Log audit
  await AuditLog.create({
    user_id: user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity_type: ENTITY_TYPES.USER,
    entity_id: user.id,
    details: `Password changed`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.PASSWORD_CHANGED
  });
});

// @desc    Upload avatar
// @route   POST /api/users/avatar
// @access  Private
export const uploadAvatar = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Check if user is authenticated
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  if (!req.file) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const user = await User.findByPk(req.user.id);

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('User')
    });
  }

  // Delete old avatar if exists
  if (user.avatar) {
    const oldFilename = path.basename(user.avatar);
    await deleteFile(oldFilename, 'AVATAR_DIR');
  }

  // Process image with sharp
  const filename = req.file.filename;
  const filePath = req.file.path;
  const processedPath = path.join(path.dirname(filePath), `processed-${filename}`);

  await sharp(filePath)
    .resize(500, 500, { fit: 'cover' })
    .jpeg({ quality: 90 })
    .toFile(processedPath);

  // Replace original with processed
  fs.unlinkSync(filePath);
  fs.renameSync(processedPath, filePath);

  // Update user avatar
  const avatarUrl = `/uploads/avatars/${filename}`;
  await user.update({ avatar: avatarUrl });

  // Log audit
  await AuditLog.create({
    user_id: user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity_type: ENTITY_TYPES.USER,
    entity_id: user.id,
    details: `Avatar uploaded`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.AVATAR_UPLOADED,
    data: { avatar: avatarUrl }
  });
});

// @desc    Remove avatar
// @route   DELETE /api/users/avatar
// @access  Private
export const removeAvatar = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Check if user is authenticated
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const user = await User.findByPk(req.user.id);

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('User')
    });
  }

  if (user.avatar) {
    const filename = path.basename(user.avatar);
    await deleteFile(filename, 'AVATAR_DIR');
    await user.update({ avatar: null });
  }

  // Log audit
  await AuditLog.create({
    user_id: user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity_type: ENTITY_TYPES.USER,
    entity_id: user.id,
    details: `Avatar removed`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.AVATAR_REMOVED
  });
});

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit, role, search } = req.query;

  // getPagination returns { take, skip, page, limit }
  const pagination = getPagination(page as string, limit as string);

  // Use the correct property names
  const take = pagination.take;
  const skip = pagination.skip;

  let whereClause: any = {};

  if (role) {
    whereClause.role = role;
  }

  if (search) {
    whereClause = {
      ...whereClause,
      [Op.or]: [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ]
    };
  }

  const users = await User.findAndCountAll({
    where: whereClause,
    attributes: { exclude: ['password'] },
    limit: take,      // Use take instead of limit
    offset: skip,     // Use skip instead of offset
    order: [['created_at', 'DESC']]
  });

  const response = getPagingData(users, page as string, limit as string);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: response
  });
});

// @desc    Get user by ID (Admin/Manager only)
// @route   GET /api/users/:id
// @access  Private/Admin/Manager
export const getUserById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const user = await User.findByPk(id, {
    attributes: { exclude: ['password'] },
    include: ['organization']
  });

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('User')
    });
  }

  // Get user stats
  const contactsCount = await Contact.count({ where: { user_id: id } });
  const dealsCount = await Deal.count({ where: { user_id: id } });
  const ticketsCount = await Ticket.count({ where: { [Op.or]: [{ user_id: id }, { assigned_to: id }] } });
  const activitiesCount = await Activity.count({ where: { user_id: id } });

  const userData = user.toJSON();
  const userDataWithStats = {
    ...userData,
    stats: {
      contacts_created: contactsCount,
      deals_owned: dealsCount,
      tickets_assigned: ticketsCount,
      activities_logged: activitiesCount
    }
  };

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: userDataWithStats
  });
});

// @desc    Update user role (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private/Admin
export const updateUserRole = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Check if user is authenticated
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const { id } = req.params;
  const { role } = req.body;

  if (!Object.values(USER_ROLES).includes(role)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Invalid role'
    });
  }

  const user = await User.findByPk(id);

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('User')
    });
  }

  await user.update({ role });

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity_type: ENTITY_TYPES.USER,
    entity_id: user.id,
    details: `User role updated to ${role}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.UPDATED('User role'),
    data: { id: user.id, role: user.role, updated_at: user.updated_at }
  });
});

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Check if user is authenticated
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const { id } = req.params;

  // Prevent self-deletion
  if (parseInt(id) === req.user.id) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Cannot delete your own account'
    });
  }

  const user = await User.findByPk(id);

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('User')
    });
  }

  // Delete avatar if exists
  if (user.avatar) {
    const filename = path.basename(user.avatar);
    await deleteFile(filename, 'AVATAR_DIR');
  }

  await user.destroy();

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.DELETE,
    entity_type: ENTITY_TYPES.USER,
    entity_id: parseInt(id),
    details: `User deleted: ${user.email}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.DELETED('User')
  });
});