import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database';
import { UserAttributes, UserCreationAttributes } from '../types/models';
import { UserSettings } from '../types/index';

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: number;
    public email!: string;
    public password_hash!: string;
    public first_name!: string | null;
    public last_name!: string | null;
    public role!: 'admin' | 'manager' | 'agent';
    public avatar!: string | null;
    public is_verified!: boolean;
    public verification_token!: string | null;
    public reset_password_token!: string | null;
    public reset_password_expires!: Date | null;
    public last_login!: Date | null;
    public settings!: UserSettings;
    public organization_id!: number | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Instance methods
    public async validatePassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.password_hash);
    }

    public toJSON(): Partial<UserAttributes> {
        const {
            password_hash,
            verification_token,
            reset_password_token,
            reset_password_expires,
            ...safeValues
        } = this.get() as UserAttributes;

        return safeValues;
    }
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password_hash: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        first_name: {
            type: DataTypes.STRING(100)
        },
        last_name: {
            type: DataTypes.STRING(100)
        },
        role: {
            type: DataTypes.ENUM('admin', 'manager', 'agent'),
            defaultValue: 'agent'
        },
        avatar: {
            type: DataTypes.TEXT
        },
        is_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        verification_token: {
            type: DataTypes.STRING(255)
        },
        reset_password_token: {
            type: DataTypes.STRING(255)
        },
        reset_password_expires: {
            type: DataTypes.DATE
        },
        last_login: {
            type: DataTypes.DATE
        },
        settings: {
            type: DataTypes.JSONB,
            defaultValue: {
                notifications: true,
                theme: 'light',
                language: 'en'
            }
        },
        organization_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'organizations',
                key: 'id'
            }
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
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        hooks: {
            beforeCreate: async (user: User) => {
                if (user.password_hash) {
                    const salt = await bcrypt.genSalt(10);
                    user.password_hash = await bcrypt.hash(user.password_hash, salt);
                }
            },
            beforeUpdate: async (user: User) => {
                if (user.changed('password_hash')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password_hash = await bcrypt.hash(user.password_hash, salt);
                }
            }
        },
        indexes: [
            {
                unique: true,
                fields: ['email']
            },
            {
                fields: ['organization_id']
            },
            {
                fields: ['role']
            }
        ]
    }
);

export default User;