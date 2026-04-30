import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { MESSAGE_PARTICIPANT_STATUS } from '../utils/constants/notificationTypes';

export interface MessageParticipantAttributes {
  id: number;
  message_id: number;
  user_id: number;
  can_receive: boolean;
  status: 'active' | 'left' | 'hidden';
  read_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface MessageParticipantCreationAttributes extends Optional<MessageParticipantAttributes, 'id' | 'read_at' | 'created_at' | 'updated_at'> {}

class MessageParticipant extends Model<MessageParticipantAttributes, MessageParticipantCreationAttributes> implements MessageParticipantAttributes {
  public id!: number;
  public message_id!: number;
  public user_id!: number;
  public can_receive!: boolean;
  public status!: 'active' | 'left' | 'hidden';
  public read_at!: Date | null;
  public created_at!: Date;
  public updated_at!: Date;
}

MessageParticipant.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    message_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'messages',
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
    can_receive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    status: {
      type: DataTypes.ENUM(...Object.values(MESSAGE_PARTICIPANT_STATUS)),
      allowNull: false,
      defaultValue: MESSAGE_PARTICIPANT_STATUS.ACTIVE
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
    tableName: 'message_participants',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeUpdate: (participant: MessageParticipant) => {
        participant.updated_at = new Date();
      }
    },
    indexes: [
      {
        fields: ['message_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['status']
      }
    ]
  }
);

export default MessageParticipant;