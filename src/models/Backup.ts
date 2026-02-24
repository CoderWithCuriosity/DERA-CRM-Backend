import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface BackupAttributes {
  id: number;
  filename: string;
  path: string;
  size: number;
  status: 'pending' | 'completed' | 'failed';
  error_message: string | null;
  created_at: Date;
  completed_at: Date | null;
}

export interface BackupCreationAttributes extends Optional<BackupAttributes, 'id' | 'status' | 'error_message' | 'completed_at'> {}

class Backup extends Model<BackupAttributes, BackupCreationAttributes> implements BackupAttributes {
  public id!: number;
  public filename!: string;
  public path!: string;
  public size!: number;
  public status!: 'pending' | 'completed' | 'failed';
  public error_message!: string | null;
  public created_at!: Date;
  public completed_at!: Date | null;

  public toJSON() {
    const values = { ...this.get() };
    return values;
  }
}

Backup.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    path: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    size: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'backups',
    timestamps: true,
    underscored: true,
    updatedAt: false,
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['created_at']
      }
    ]
  }
);

export default Backup; 