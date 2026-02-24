import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface PasswordResetAttributes {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PasswordResetCreationAttributes extends Optional<PasswordResetAttributes, 'id' | 'token' | 'used' | 'created_at' | 'updated_at'> {}

class PasswordReset extends Model<PasswordResetAttributes, PasswordResetCreationAttributes> implements PasswordResetAttributes {
  public id!: number;
  public user_id!: number;
  public token!: string;
  public expires_at!: Date;
  public used!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  // Instance methods
  public isExpired(): boolean {
    return new Date() > new Date(this.expires_at);
  }

  public isValid(): boolean {
    return !this.used && !this.isExpired();
  }

  public toJSON() {
    const values = { ...this.get() };
    return values;
  }
}

PasswordReset.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv4()
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
    tableName: 'password_resets',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeUpdate: (reset: PasswordReset) => {
        reset.updated_at = new Date();
      }
    },
    indexes: [
      {
        unique: true,
        fields: ['token']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['expires_at']
      },
      {
        fields: ['used']
      }
    ]
  }
);

export default PasswordReset;