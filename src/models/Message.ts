import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface MessageAttributes {
  id: number;
  subject: string | null;
  body: string;
  parent_id: number | null;
  sent_by: number;
  is_private: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'subject' | 'parent_id' | 'created_at' | 'updated_at'> {}

class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: number;
  public subject!: string | null;
  public body!: string;
  public parent_id!: number | null;
  public sent_by!: number;
  public is_private!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

Message.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'messages',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    sent_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    is_private: {
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
    tableName: 'messages',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeUpdate: (message: Message) => {
        message.updated_at = new Date();
      }
    },
    indexes: [
      {
        fields: ['parent_id']
      },
      {
        fields: ['sent_by']
      },
      {
        fields: ['created_at']
      }
    ]
  }
);

export default Message;