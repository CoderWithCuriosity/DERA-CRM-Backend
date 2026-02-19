import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { EmailTemplateAttributes, EmailTemplateCreationAttributes } from '../types/models';
import User from './User';

class EmailTemplate extends Model<EmailTemplateAttributes, EmailTemplateCreationAttributes> implements EmailTemplateAttributes {
    public id!: number;
    public user_id!: number;
    public name!: string;
    public subject!: string;
    public body!: string;
    public variables!: string[];
    public is_html!: boolean;
    
    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Virtuals
    public get preview(): string {
        // Get first 100 characters of body without HTML tags
        const stripped = this.body.replace(/<[^>]*>?/gm, '');
        return stripped.length > 100 ? `${stripped.substring(0, 100)}...` : stripped;
    }
}

EmailTemplate.init(
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
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        subject: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        body: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        variables: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: []
        },
        is_html: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
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
        tableName: 'email_templates',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['user_id']
            },
            {
                fields: ['name']
            }
        ]
    }
);

// Associations
EmailTemplate.belongsTo(User, { foreignKey: 'user_id', as: 'creator' });

export default EmailTemplate;