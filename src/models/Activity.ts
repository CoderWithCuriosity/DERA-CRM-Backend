import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { ActivityAttributes, ActivityCreationAttributes } from '../types/models';
import User from './User';
import Contact from './Contact';
import Deal from './Deal';

class Activity extends Model<ActivityAttributes, ActivityCreationAttributes> implements ActivityAttributes {
    public id!: number;
    public user_id!: number;
    public contact_id!: number | null;
    public deal_id!: number | null;
    public type!: 'call' | 'email' | 'meeting' | 'task' | 'note';
    public subject!: string | null;
    public description!: string | null;
    public duration!: number | null;
    public outcome!: string | null;
    public scheduled_date!: Date | null;
    public completed_date!: Date | null;
    public status!: 'scheduled' | 'completed' | 'cancelled';
    public priority!: 'low' | 'medium' | 'high';
    
    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Virtuals
    public get is_overdue(): boolean {
        if (this.status === 'scheduled' && this.scheduled_date) {
            return new Date() > new Date(this.scheduled_date);
        }
        return false;
    }

    public get is_completed(): boolean {
        return this.status === 'completed';
    }
}

Activity.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
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
        deal_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'deals',
                key: 'id'
            }
        },
        type: {
            type: DataTypes.ENUM('call', 'email', 'meeting', 'task', 'note'),
            allowNull: false
        },
        subject: {
            type: DataTypes.STRING(255)
        },
        description: {
            type: DataTypes.TEXT
        },
        duration: {
            type: DataTypes.INTEGER,
            comment: 'Duration in minutes'
        },
        outcome: {
            type: DataTypes.STRING(255)
        },
        scheduled_date: {
            type: DataTypes.DATE
        },
        completed_date: {
            type: DataTypes.DATE
        },
        status: {
            type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
            defaultValue: 'scheduled'
        },
        priority: {
            type: DataTypes.ENUM('low', 'medium', 'high'),
            defaultValue: 'medium'
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
        tableName: 'activities',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['user_id']
            },
            {
                fields: ['contact_id']
            },
            {
                fields: ['deal_id']
            },
            {
                fields: ['scheduled_date']
            },
            {
                fields: ['status']
            },
            {
                fields: ['type']
            }
        ]
    }
);

// Associations
Activity.belongsTo(User, { foreignKey: 'user_id', as: 'creator' });
Activity.belongsTo(Contact, { foreignKey: 'contact_id' });
Activity.belongsTo(Deal, { foreignKey: 'deal_id' });

export default Activity;