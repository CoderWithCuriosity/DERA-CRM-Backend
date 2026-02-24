import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { AUDIT_ACTIONS, ENTITY_TYPES, AuditAction, EntityType } from '../config/constants';

export interface AuditLogAttributes {
  id: number;
  user_id: number | null;
  action: AuditAction;
  entity_type: EntityType;
  entity_id: number;
  details: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'user_id' | 'ip_address' | 'user_agent' | 'created_at'> {}

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  public id!: number;
  public user_id!: number | null;
  public action!: AuditAction;
  public entity_type!: EntityType;
  public entity_id!: number;
  public details!: string;
  public ip_address!: string | null;
  public user_agent!: string | null;
  public created_at!: Date;

  public toJSON() {
    const values = { ...this.get() };
    return values;
  }
}

AuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.ENUM(...Object.values(AUDIT_ACTIONS)),
      allowNull: false
    },
    entity_type: {
      type: DataTypes.ENUM(...Object.values(ENTITY_TYPES)),
      allowNull: false
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'audit_logs',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['action']
      },
      {
        fields: ['entity_type', 'entity_id']
      },
      {
        fields: ['created_at']
      }
    ]
  }
);

export default AuditLog;