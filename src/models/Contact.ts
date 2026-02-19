import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { ContactAttributes, ContactCreationAttributes } from '../types/models';
import User from './User';

class Contact extends Model<ContactAttributes, ContactCreationAttributes> implements ContactAttributes {
    public id!: number;
    public user_id!: number;
    public first_name!: string | null;
    public last_name!: string | null;
    public email!: string | null;
    public phone!: string | null;
    public company!: string | null;
    public job_title!: string | null;
    public status!: 'active' | 'inactive' | 'lead';
    public source!: string | null;
    public notes!: string | null;
    public tags!: string[];
    public custom_fields!: Record<string, any>;
    
    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Virtuals
    public get fullName(): string | null {
        if (this.first_name && this.last_name) {
            return `${this.first_name} ${this.last_name}`;
        }
        return this.first_name || this.last_name || null;
    }
}

Contact.init(
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
        first_name: {
            type: DataTypes.STRING(100)
        },
        last_name: {
            type: DataTypes.STRING(100)
        },
        email: {
            type: DataTypes.STRING(255),
            validate: {
                isEmail: true
            }
        },
        phone: {
            type: DataTypes.STRING(50)
        },
        company: {
            type: DataTypes.STRING(255)
        },
        job_title: {
            type: DataTypes.STRING(100)
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'lead'),
            defaultValue: 'active'
        },
        source: {
            type: DataTypes.STRING(100)
        },
        notes: {
            type: DataTypes.TEXT
        },
        tags: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: []
        },
        custom_fields: {
            type: DataTypes.JSONB,
            defaultValue: {}
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
        tableName: 'contacts',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['user_id']
            },
            {
                fields: ['email']
            },
            {
                fields: ['company']
            },
            {
                fields: ['status']
            },
            {
                fields: ['tags'],
                using: 'gin'
            }
        ]
    }
);

// Associations
Contact.belongsTo(User, { foreignKey: 'user_id', as: 'creator' });

export default Contact;