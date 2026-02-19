import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { TicketAttributes, TicketCreationAttributes } from '../types/models';
import User from './User';
import Contact from './Contact';

class Ticket extends Model<TicketAttributes, TicketCreationAttributes> implements TicketAttributes {
    public id!: number;
    public ticket_number!: string;
    public user_id!: number;
    public contact_id!: number | null;
    public assigned_to!: number | null;
    public subject!: string;
    public description!: string | null;
    public priority!: 'low' | 'medium' | 'high' | 'urgent';
    public status!: 'new' | 'open' | 'pending' | 'resolved' | 'closed';
    public due_date!: Date | null;
    public resolved_at!: Date | null;
    public first_response_at!: Date | null;
    public resolution_time!: number | null;
    public response_time!: number | null;
    public satisfaction_rating!: number | null;
    public satisfaction_comment!: string | null;
    public tags!: string[];
    
    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Virtuals
    public get is_overdue(): boolean {
        if (this.due_date && this.status !== 'resolved' && this.status !== 'closed') {
            return new Date() > new Date(this.due_date);
        }
        return false;
    }

    public get is_breached(): boolean {
        // This would check SLA breaches
        return false;
    }
}

Ticket.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        ticket_number: {
            type: DataTypes.STRING(50),
            unique: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        contact_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'contacts',
                key: 'id'
            }
        },
        assigned_to: {
            type: DataTypes.INTEGER,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        subject: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT
        },
        priority: {
            type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
            defaultValue: 'medium'
        },
        status: {
            type: DataTypes.ENUM('new', 'open', 'pending', 'resolved', 'closed'),
            defaultValue: 'new'
        },
        due_date: {
            type: DataTypes.DATEONLY
        },
        resolved_at: {
            type: DataTypes.DATE
        },
        first_response_at: {
            type: DataTypes.DATE
        },
        resolution_time: {
            type: DataTypes.INTEGER,
            comment: 'Time to resolution in minutes'
        },
        response_time: {
            type: DataTypes.INTEGER,
            comment: 'Time to first response in minutes'
        },
        satisfaction_rating: {
            type: DataTypes.INTEGER,
            validate: {
                min: 1,
                max: 5
            }
        },
        satisfaction_comment: {
            type: DataTypes.TEXT
        },
        tags: {
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
        tableName: 'tickets',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        hooks: {
            beforeCreate: async (ticket: Ticket) => {
                // Generate ticket number
                const year = new Date().getFullYear();
                const count = await Ticket.count() + 1;
                ticket.ticket_number = `TKT-${year}-${String(count).padStart(4, '0')}`;
            },
            beforeUpdate: async (ticket: Ticket) => {
                // Calculate response time when first response is set
                if (ticket.changed('first_response_at') && ticket.first_response_at) {
                    const created = new Date(ticket.created_at);
                    const responded = new Date(ticket.first_response_at);
                    ticket.response_time = Math.round((responded.getTime() - created.getTime()) / (1000 * 60));
                }
                
                // Calculate resolution time when resolved
                if (ticket.changed('resolved_at') && ticket.resolved_at) {
                    const created = new Date(ticket.created_at);
                    const resolved = new Date(ticket.resolved_at);
                    ticket.resolution_time = Math.round((resolved.getTime() - created.getTime()) / (1000 * 60));
                }
            }
        },
        indexes: [
            {
                unique: true,
                fields: ['ticket_number']
            },
            {
                fields: ['user_id']
            },
            {
                fields: ['contact_id']
            },
            {
                fields: ['assigned_to']
            },
            {
                fields: ['status']
            },
            {
                fields: ['priority']
            },
            {
                fields: ['due_date']
            }
        ]
    }
);

// Associations
Ticket.belongsTo(User, { foreignKey: 'user_id', as: 'creator' });
Ticket.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });
Ticket.belongsTo(Contact, { foreignKey: 'contact_id' });

export default Ticket;