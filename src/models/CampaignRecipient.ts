import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface CampaignRecipientAttributes {
  id: number;
  campaign_id: number;
  contact_id: number;
  email: string;
  status: 'pending' | 'sent' | 'failed' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
  sent_at: Date | null;
  opened_at: Date | null;
  clicked_at: Date | null;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CampaignRecipientCreationAttributes extends Optional<CampaignRecipientAttributes, 'id' | 'sent_at' | 'opened_at' | 'clicked_at' | 'error_message' | 'created_at' | 'updated_at'> {}

class CampaignRecipient extends Model<CampaignRecipientAttributes, CampaignRecipientCreationAttributes> implements CampaignRecipientAttributes {
  public id!: number;
  public campaign_id!: number;
  public contact_id!: number;
  public email!: string;
  public status!: 'pending' | 'sent' | 'failed' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
  public sent_at!: Date | null;
  public opened_at!: Date | null;
  public clicked_at!: Date | null;
  public error_message!: string | null;
  public created_at!: Date;
  public updated_at!: Date;

  public toJSON() {
    const values = { ...this.get() };
    return values;
  }
}

CampaignRecipient.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    campaign_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'campaigns',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    contact_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'contacts',
        key: 'id'
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'failed', 'opened', 'clicked', 'bounced', 'unsubscribed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    opened_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    clicked_at: {
      type: DataTypes.DATE,
      allowNull: true
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
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'campaign_recipients',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeUpdate: (recipient: CampaignRecipient) => {
        recipient.updated_at = new Date();
      }
    },
    indexes: [
      {
        fields: ['campaign_id']
      },
      {
        fields: ['contact_id']
      },
      {
        fields: ['status']
      },
      {
        unique: true,
        fields: ['campaign_id', 'contact_id']
      }
    ]
  }
);

export default CampaignRecipient;