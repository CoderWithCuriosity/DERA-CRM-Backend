import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { CAMPAIGN_STATUS, CampaignStatus } from '../config/constants';

export interface CampaignAttributes {
  id: number;
  name: string;
  template_id: number;
  user_id: number;
  status: CampaignStatus;
  target_count: number;
  sent_count: number;
  open_count: number;
  click_count: number;
  scheduled_at: Date | null;
  sent_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CampaignCreationAttributes extends Optional<CampaignAttributes, 'id' | 'sent_count' | 'open_count' | 'click_count' | 'scheduled_at' | 'sent_at' | 'created_at' | 'updated_at'> {}

class Campaign extends Model<CampaignAttributes, CampaignCreationAttributes> implements CampaignAttributes {
  public id!: number;
  public name!: string;
  public template_id!: number;
  public user_id!: number;
  public status!: CampaignStatus;
  public target_count!: number;
  public sent_count!: number;
  public open_count!: number;
  public click_count!: number;
  public scheduled_at!: Date | null;
  public sent_at!: Date | null;
  public created_at!: Date;
  public updated_at!: Date;

  // Virtual fields
  public get openRate(): number {
    if (this.sent_count === 0) return 0;
    return (this.open_count / this.sent_count) * 100;
  }

  public get clickRate(): number {
    if (this.sent_count === 0) return 0;
    return (this.click_count / this.sent_count) * 100;
  }

  public get clickToOpenRate(): number {
    if (this.open_count === 0) return 0;
    return (this.click_count / this.open_count) * 100;
  }

  public toJSON() {
    const values = { ...this.get() };
    return values;
  }
}

Campaign.init(
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
    template_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'email_templates',
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
    status: {
      type: DataTypes.ENUM(...Object.values(CAMPAIGN_STATUS)),
      allowNull: false,
      defaultValue: CAMPAIGN_STATUS.DRAFT
    },
    target_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    sent_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    open_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    click_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sent_at: {
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
    tableName: 'campaigns',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeUpdate: (campaign: Campaign) => {
        campaign.updated_at = new Date();
      }
    },
    indexes: [
      {
        fields: ['template_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['scheduled_at']
      }
    ]
  }
);

export default Campaign;