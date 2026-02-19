import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { TicketCommentAttributes, TicketCommentCreationAttributes } from '../types/models';
import User from './User';
import Ticket from './Ticket';

class TicketComment extends Model<TicketCommentAttributes, TicketCommentCreationAttributes> implements TicketCommentAttributes {
    public id!: number;
    public ticket_id!: number;
    public user_id!: number;
    public comment!: string;
    public is_internal!: boolean;
    public attachments!: string[];
    
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

TicketComment.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        ticket_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'tickets',
                key: 'id'
            }
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        is_internal: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        attachments: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: []
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        sequelize,
        tableName: 'ticket_comments',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['ticket_id']
            },
            {
                fields: ['user_id']
            }
        ]
    }
);

// Associations
TicketComment.belongsTo(Ticket, { foreignKey: 'ticket_id' });
TicketComment.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

export default TicketComment;