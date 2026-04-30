import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface UserNotificationPreferenceAttributes {
  id: number;
  user_id: number;
  type: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserNotificationPreferenceCreationAttributes extends Optional<UserNotificationPreferenceAttributes, 'id' | 'created_at' | 'updated_at'> {}

class UserNotificationPreference extends Model<UserNotificationPreferenceAttributes, UserNotificationPreferenceCreationAttributes> implements UserNotificationPreferenceAttributes {
  public id!: number;
  public user_id!: number;
  public type!: string;
  public email_enabled!: boolean;
  public in_app_enabled!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

UserNotificationPreference.init(
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
    email_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    in_app_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
    tableName: 'user_notification_preferences',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeUpdate: (pref: UserNotificationPreference) => {
        pref.updated_at = new Date();
      }
    },
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'type']
      }
    ]
  }
);

export default UserNotificationPreference;