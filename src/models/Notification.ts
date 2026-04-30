import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface NotificationAttributes {
  id: number;
  user_id: number;
  type: string;
  title: string;
  body: string;
  data: any;
  read_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'read_at' | 'created_at' | 'updated_at'> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: number;
  public user_id!: number;
  public type!: string;
  public title!: string;
  public body!: string;
  public data!: any;
  public read_at!: Date | null;
  public created_at!: Date;
  public updated_at!: Date;

  public get isRead(): boolean {
    return this.read_at !== null;
  }
}

Notification.init(
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
    type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true
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
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeUpdate: (notification: Notification) => {
        notification.updated_at = new Date();
      }
    },
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['read_at']
      },
      {
        fields: ['created_at']
      }
    ]
  }
);

export default Notification;