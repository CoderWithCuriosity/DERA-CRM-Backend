import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { CampaignAttributes, CampaignCreationAttributes } from '../types/models';
import User from './User';
import EmailTemplate from './EmailTemplate';

class Campaign extends Model<CampaignAttributes, CampaignCreationAttributes> implements CampaignAttributes {
    public id!: number;
    public user_id!: number;
    public template_id!: number | null;
    public name!: string;
    public status!: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
    public target_list!: Record<string, any>;
    public target_count!: number;
    public sent_count!: number;
    public open_count!: number;
    public click_count!: number;
    public bounce_count!: number;
    public unsubscribe_count!: number;
    public complaint_count!: number;
    public scheduled_at!: Date | null;
    public sent_at!: Date | null;
    public completed_at!: Date | null;
    
    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Virtuals
    public get open_rate(): number {
        if (this.sent_count === 0) return 0;
        return (this.open_count / this.sent_count) * 100;
    }

    public get click_rate(): number {
        if (this.sent_count === 0) return 0;
        return (this.click_count / this.sent_count) * 100;
    }

    public get bounce_rate(): number {
        if (this.target_count === 0) return 0;
        return (this.bounce_count / this.target_count) * 100;
    }
}

Campaign.init(
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
        template_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'email_templates',
                key: 'id'
            }
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('draft', 'scheduled', 'sending', 'sent', 'cancelled'),
            defaultValue: 'draft'
        },
        target_list: {
            type: DataTypes.JSONB,
            defaultValue: {}
        },
        target_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        sent_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        open_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        click_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        bounce_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        unsubscribe_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        complaint_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        scheduled_at: {
            type: DataTypes.DATE
        },
        sent_at: {
            type: DataTypes.DATE
        },
        completed_at: {
            type: DataTypes.DATE
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
        tableName: 'campaigns',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['user_id']
            },
            {
                fields: ['template_id']
            },
            {
                fields: ['status']
            },
            {
                fields: ['scheduled_at']
            }
        ]
    }
);

// Associations
Campaign.belongsTo(User, { foreignKey: 'user_id', as: 'creator' });
Campaign.belongsTo(EmailTemplate, { foreignKey: 'template_id' });

export default Campaign;