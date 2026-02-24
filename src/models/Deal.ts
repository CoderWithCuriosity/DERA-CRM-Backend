import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { DEAL_STAGES, DEAL_STATUS, DealStage, DealStatus } from '../config/constants';

export interface DealAttributes {
  id: number;
  name: string;
  contact_id: number;
  user_id: number;
  stage: DealStage;
  amount: number;
  probability: number;
  expected_close_date: Date | null;
  actual_close_date: Date | null;
  status: DealStatus;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DealCreationAttributes extends Optional<DealAttributes, 'id' | 'actual_close_date' | 'notes' | 'created_at' | 'updated_at'> {}

class Deal extends Model<DealAttributes, DealCreationAttributes> implements DealAttributes {
  public id!: number;
  public name!: string;
  public contact_id!: number;
  public user_id!: number;
  public stage!: DealStage;
  public amount!: number;
  public probability!: number;
  public expected_close_date!: Date | null;
  public actual_close_date!: Date | null;
  public status!: DealStatus;
  public notes!: string | null;
  public created_at!: Date;
  public updated_at!: Date;

  // Virtual fields
  public get weightedAmount(): number {
    return this.amount * (this.probability / 100);
  }

  public get isOverdue(): boolean {
    if (!this.expected_close_date || this.status !== DEAL_STATUS.OPEN) return false;
    return new Date() > new Date(this.expected_close_date);
  }

  public toJSON() {
    const values = { ...this.get() };
    return values;
  }
}

Deal.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    contact_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'contacts',
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
    stage: {
      type: DataTypes.ENUM(...Object.values(DEAL_STAGES)),
      allowNull: false,
      defaultValue: DEAL_STAGES.LEAD
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    probability: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    expected_close_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    actual_close_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM(...Object.values(DEAL_STATUS)),
      allowNull: false,
      defaultValue: DEAL_STATUS.OPEN
    },
    notes: {
      type: DataTypes.TEXT,
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
    tableName: 'deals',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeUpdate: (deal: Deal) => {
        deal.updated_at = new Date();
        
        // Update status based on stage
        if (deal.stage === DEAL_STAGES.WON) {
          deal.status = DEAL_STATUS.WON;
          if (!deal.actual_close_date) {
            deal.actual_close_date = new Date();
          }
        } else if (deal.stage === DEAL_STAGES.LOST) {
          deal.status = DEAL_STATUS.LOST;
          if (!deal.actual_close_date) {
            deal.actual_close_date = new Date();
          }
        }
      }
    },
    indexes: [
      {
        fields: ['contact_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['stage']
      },
      {
        fields: ['status']
      },
      {
        fields: ['expected_close_date']
      }
    ]
  }
);

export default Deal;