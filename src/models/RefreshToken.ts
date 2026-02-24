import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface RefreshTokenAttributes {
  id: number;
  token: string;
  user_id: number;
  expires_at: Date;
  revoked: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshTokenCreationAttributes extends Optional<RefreshTokenAttributes, 'id' | 'token' | 'revoked' | 'created_at' | 'updated_at'> {}

class RefreshToken extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes> implements RefreshTokenAttributes {
  public id!: number;
  public token!: string;
  public user_id!: number;
  public expires_at!: Date;
  public revoked!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  // Instance methods
  public isExpired(): boolean {
    return new Date() > new Date(this.expires_at);
  }

  public isValid(): boolean {
    return !this.revoked && !this.isExpired();
  }

  public toJSON() {
    const values = { ...this.get() };
    return values;
  }
}

RefreshToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv4()
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
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    revoked: {
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
    tableName: 'refresh_tokens',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeUpdate: (token: RefreshToken) => {
        token.updated_at = new Date();
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
        fields: ['revoked']
      }
    ]
  }
);

export default RefreshToken;