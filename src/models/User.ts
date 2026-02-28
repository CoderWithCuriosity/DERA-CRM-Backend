import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';
import { USER_ROLES, UserRole } from '../config/constants';

export interface UserAttributes {
  id: number;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar: string | null;
  is_verified: boolean;
  last_login: Date | null;
  organization_id: number | null;
  settings: {
    notifications: boolean;
    theme: 'light' | 'dark';
    language: string;
  };
  created_at: Date;
  updated_at: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'avatar' | 'is_verified' | 'last_login' | 'organization_id' | 'settings' | 'created_at' | 'updated_at'> { }

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public password!: string;
  public first_name!: string;
  public last_name!: string;
  public role!: UserRole;
  public avatar!: string | null;
  public is_verified!: boolean;
  public last_login!: Date | null;
  public organization_id!: number | null;
  public settings!: {
    notifications: boolean;
    theme: 'light' | 'dark';
    language: string;
  };
  public created_at!: Date;
  public updated_at!: Date;

  // Virtual fields
  public get fullName(): string {
    return `${this.first_name} ${this.last_name}`;
  }

  // Instance methods
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  public async updateLastLogin(): Promise<void> {
    this.last_login = new Date();
    await this.save();
  }

  public toJSON() {
    const { password, ...values } = this.get();
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [8, 100]
      }
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    role: {
      type: DataTypes.ENUM(...Object.values(USER_ROLES)),
      allowNull: false,
      defaultValue: USER_ROLES.AGENT
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id'
      }
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        notifications: true,
        theme: 'light',
        language: 'en'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
        user.updated_at = new Date();
      }
    },
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['role']
      },
      {
        fields: ['organization_id']
      }
    ]
  }
);

export default User;