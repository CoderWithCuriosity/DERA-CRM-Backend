import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { Message, MessageParticipant, User } from '../models';
import {
    HTTP_STATUS,
    SUCCESS_MESSAGES,
    ERROR_MESSAGES,
    AUDIT_ACTIONS,
    ENTITY_TYPES,
    USER_ROLES
} from '../config/constants';
import catchAsync from '../utils/catchAsync';
import { getPagination, getPagingData } from '../utils/pagination';
import { createSimpleAudit } from '../utils/auditHelper';
import { createMessageWithNotifications, markNotificationAsRead } from '../services/notificationServiceExtended';

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
export const sendMessage = catchAsync(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: ERROR_MESSAGES.VALIDATION_FAILED,
            errors: errors.array()
        });
    }

    const { subject, body, recipient_ids, parent_id, is_private } = req.body;

    // Ensure recipients are valid users
    const recipients = await User.findAll({
        where: {
            id: recipient_ids,
            role: { [Op.in]: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.AGENT] }
        }
    });

    if (recipients.length === 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'At least one valid recipient is required'
        });
    }

    // For replies, get existing participants
    let participantIds = recipients.map(r => r.id);

    if (parent_id) {
        const parentMessage = await Message.findByPk(parent_id);
        if (parentMessage) {
            const existingParticipants = await MessageParticipant.findAll({
                where: { message_id: parent_id },
                attributes: ['user_id']
            });
            const existingIds = existingParticipants.map(p => p.user_id);
            participantIds = [...new Set([...participantIds, ...existingIds])];
        }
    }

    const message = await createMessageWithNotifications(
        subject || null,
        body,
        req.user.id,
        participantIds,
        parent_id || null,
        is_private || false
    );

    // Log audit
    await createSimpleAudit(
        req.user.id,
        AUDIT_ACTIONS.CREATE,
        ENTITY_TYPES.MESSAGE,
        message.id,
        `Sent message to ${recipients.length} recipient(s)`,
        req
    );

    return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: SUCCESS_MESSAGES.CREATED('Message'),
        data: { message }
    });
});

// @desc    Get user's messages
// @route   GET /api/messages
// @access  Private
export const getMessages = catchAsync(async (req: Request, res: Response) => {
    const { page, limit, folder = 'inbox' } = req.query;

    const { take, skip } = getPagination(page as string, limit as string);

    // Get message IDs where user is a participant
    const participantMessages = await MessageParticipant.findAll({
        where: {
            user_id: req.user.id,
            status: folder === 'trash' ? 'hidden' : 'active'
        },
        attributes: ['message_id', 'read_at', 'can_receive']
    });

    const messageIds = participantMessages.map(p => p.message_id);
    const readStatusMap = new Map(participantMessages.map(p => [p.message_id, p.read_at]));

    if (messageIds.length === 0) {
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            data: { rows: [], count: 0, page: 1, totalPages: 0 }
        });
    }

    // Build where clause based on folder
    let folderWhere: any = {};

    if (folder === 'inbox') {
        // Messages not sent by this user
        folderWhere.sent_by = { [Op.ne]: req.user.id };
    } else if (folder === 'sent') {
        folderWhere.sent_by = req.user.id;
    }
    // 'all' includes both sent and received

    const messages = await Message.findAndCountAll({
        where: {
            id: { [Op.in]: messageIds },
            ...folderWhere
        },
        limit: take,
        offset: skip,
        order: [['created_at', 'DESC']],
        include: [
            {
                model: User,
                as: 'sender',
                attributes: ['id', 'first_name', 'last_name', 'avatar']
            },
            {
                model: Message,
                as: 'parent',
                attributes: ['id', 'subject', 'body', 'sent_by', 'created_at'],
                include: [
                    {
                        model: User,
                        as: 'sender',
                        attributes: ['id', 'first_name', 'last_name']
                    }
                ]
            },
            {
                model: MessageParticipant,
                as: 'participants',
                attributes: ['user_id', 'read_at'],
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'first_name', 'last_name']
                    }
                ]
            }
        ]
    });

    // Enhance messages with read status and participant count
    const enhancedMessages = await Promise.all(messages.rows.map(async (message) => {
        const messageData = message.toJSON();

        // Get participant count for this message
        const participantCount = await MessageParticipant.count({
            where: { message_id: message.id }
        });

        return {
            ...messageData,
            read_at: readStatusMap.get(message.id) || null,
            is_read: readStatusMap.get(message.id) !== null,
            participant_count: participantCount
        };
    }));

    const response = getPagingData(
        { count: messages.count, rows: enhancedMessages },
        page as string,
        limit as string
    );

    return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: response
    });
});

// @desc    Get message by ID
// @route   GET /api/messages/:id
// @access  Private
export const getMessageById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Verify user is a participant
    const participant = await MessageParticipant.findOne({
        where: {
            message_id: id,
            user_id: req.user.id
        }
    });

    if (!participant) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            message: ERROR_MESSAGES.FORBIDDEN
        });
    }

    const message = await Message.findByPk(id, {
        include: [
            {
                model: User,
                as: 'sender',
                attributes: ['id', 'first_name', 'last_name', 'avatar', 'email']
            },
            {
                model: Message,
                as: 'parent',
                include: [
                    {
                        model: User,
                        as: 'sender',
                        attributes: ['id', 'first_name', 'last_name']
                    }
                ]
            },
            {
                model: Message,
                as: 'replies',
                include: [
                    {
                        model: User,
                        as: 'sender',
                        attributes: ['id', 'first_name', 'last_name', 'avatar']
                    }
                ]
            },
            {
                model: MessageParticipant,
                as: 'participants',
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'first_name', 'last_name', 'avatar', 'email']
                    }
                ]
            }
        ]
    });

    if (!message) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: ERROR_MESSAGES.NOT_FOUND('Message')
        });
    }

    // Mark as read if not already
    if (!participant.read_at) {
        await participant.update({ read_at: new Date() });
        await markNotificationAsRead(req.user.id, parseInt(id));
    }

    return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { message }
    });
});

// @desc    Reply to a message
// @route   POST /api/messages/:id/reply
// @access  Private
export const replyToMessage = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { body, is_private } = req.body;

    if (!body) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Reply body is required'
        });
    }

    const parentMessage = await Message.findByPk(id);
    if (!parentMessage) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: ERROR_MESSAGES.NOT_FOUND('Message')
        });
    }

    // Get all participants from parent message
    const participants = await MessageParticipant.findAll({
        where: { message_id: id },
        attributes: ['user_id']
    });

    const participantIds = participants.map(p => p.user_id);

    const reply = await createMessageWithNotifications(
        `Re: ${parentMessage.subject || 'Message'}`,
        body,
        req.user.id,
        participantIds,
        parseInt(id),
        is_private || false
    );

    // Log audit
    await createSimpleAudit(
        req.user.id,
        AUDIT_ACTIONS.CREATE,
        ENTITY_TYPES.MESSAGE,
        reply.id,
        `Replied to message ${id}`,
        req
    );

    return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Reply sent successfully',
        data: { reply }
    });
});

// @desc    Update message privacy settings
// @route   PUT /api/messages/:id/privacy
// @access  Private
export const updateMessagePrivacy = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { can_receive } = req.body;

    const participant = await MessageParticipant.findOne({
        where: {
            message_id: id,
            user_id: req.user.id
        }
    });

    if (!participant) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            message: ERROR_MESSAGES.FORBIDDEN
        });
    }

    await participant.update({ can_receive });

    return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Privacy settings updated',
        data: { can_receive: participant.can_receive }
    });
});

// @desc    Hide/delete message (move to trash)
// @route   DELETE /api/messages/:id
// @access  Private
export const hideMessage = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const participant = await MessageParticipant.findOne({
        where: {
            message_id: id,
            user_id: req.user.id
        }
    });

    if (!participant) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            message: ERROR_MESSAGES.FORBIDDEN
        });
    }

    await participant.update({ status: 'hidden' });

    return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Message moved to trash'
    });
});

// @desc    Get unread message count
// @route   GET /api/messages/unread/count
// @access  Private
export const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
    const unreadMessages = await MessageParticipant.count({
        where: {
            user_id: req.user.id,
            read_at: null,
            status: 'active'
        }
    });

    return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { unread_count: unreadMessages }
    });
});