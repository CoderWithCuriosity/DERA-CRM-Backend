import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface TicketCommentAttributes {
  id: number;
  ticket_id: number;
  user_id: number;
  comment: string;
  is_internal: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TicketCommentCreationAttributes extends Optional<TicketCommentAttributes, 'id' | 'created_at' | 'updated_at'> {}

class TicketComment extends Model<TicketCommentAttributes, TicketCommentCreationAttributes> implements TicketCommentAttributes {
  public id!: number;
  public ticket_id!: number;
  public user_id!: number;
  public comment!: string;
  public is_internal!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  public toJSON() {
    const values = { ...this.get() };
    return values;
  }
}

TicketComment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    ticket_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tickets',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    is_internal: {
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
    tableName: 'ticket_comments',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeUpdate: (comment: TicketComment) => {
        comment.updated_at = new Date();
      }
    },
    indexes: [
      {
        fields: ['ticket_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['created_at']
      }
    ]
  }
);

export default TicketComment;