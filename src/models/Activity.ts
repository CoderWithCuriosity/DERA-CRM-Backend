import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { ACTIVITY_TYPES, ACTIVITY_STATUS, ActivityType, ActivityStatus } from '../config/constants';

export interface ActivityAttributes {
  id: number;
  type: ActivityType;
  subject: string;
  description: string | null;
  contact_id: number | null;
  deal_id: number | null;
  user_id: number;
  scheduled_date: Date;
  completed_date: Date | null;
  duration: number | null;
  outcome: string | null;
  status: ActivityStatus;
  created_at: Date;
  updated_at: Date;
}

export interface ActivityCreationAttributes extends Optional<ActivityAttributes, 'id' | 'description' | 'contact_id' | 'deal_id' | 'completed_date' | 'duration' | 'outcome' | 'status' | 'created_at' | 'updated_at'> {}

class Activity extends Model<ActivityAttributes, ActivityCreationAttributes> implements ActivityAttributes {
  public id!: number;
  public type!: ActivityType;
  public subject!: string;
  public description!: string | null;
  public contact_id!: number | null;
  public deal_id!: number | null;
  public user_id!: number;
  public scheduled_date!: Date;
  public completed_date!: Date | null;
  public duration!: number | null;
  public outcome!: string | null;
  public status!: ActivityStatus;
  public created_at!: Date;
  public updated_at!: Date;

  // Virtual fields
  public get isOverdue(): boolean {
    if (this.status !== ACTIVITY_STATUS.SCHEDULED) return false;
    return new Date() > new Date(this.scheduled_date);
  }

  public get isCompleted(): boolean {
    return this.status === ACTIVITY_STATUS.COMPLETED;
  }

  public toJSON() {
    const values = { ...this.get() };
    return values;
  }
}

Activity.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    type: {
      type: DataTypes.ENUM(...Object.values(ACTIVITY_TYPES)),
      allowNull: false
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    contact_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'contacts',
        key: 'id'
      }
    },
    deal_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'deals',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    scheduled_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    completed_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration in minutes'
    },
    outcome: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ACTIVITY_STATUS)),
      allowNull: false,
      defaultValue: ACTIVITY_STATUS.SCHEDULED
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
    tableName: 'activities',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeUpdate: (activity: Activity) => {
        activity.updated_at = new Date();
        
        // Auto-update status based on completion
        if (activity.completed_date && activity.status === ACTIVITY_STATUS.SCHEDULED) {
          activity.status = ACTIVITY_STATUS.COMPLETED;
        }
      }
    },
    indexes: [
      {
        fields: ['contact_id']
      },
      {
        fields: ['deal_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['scheduled_date']
      }
    ]
  }
);

export default Activity;