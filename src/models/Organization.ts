import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface OrganizationAttributes {
  id: number;
  company_name: string;
  company_logo: string | null;
  company_email: string | null;
  company_phone: string | null;
  company_address: string | null;
  website: string | null;
  timezone: string;
  date_format: string;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrganizationCreationAttributes extends Optional<OrganizationAttributes, 'id' | 'company_logo' | 'company_email' | 'company_phone' | 'company_address' | 'website' | 'created_at' | 'updated_at'> {}

class Organization extends Model<OrganizationAttributes, OrganizationCreationAttributes> implements OrganizationAttributes {
  public id!: number;
  public company_name!: string;
  public company_logo!: string | null;
  public company_email!: string | null;
  public company_phone!: string | null;
  public company_address!: string | null;
  public website!: string | null;
  public timezone!: string;
  public date_format!: string;
  public currency!: string;
  public created_at!: Date;
  public updated_at!: Date;

  public toJSON() {
    const values = { ...this.get() };
    return values;
  }
}

Organization.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    company_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    company_logo: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    company_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    company_phone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    company_address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'UTC'
    },
    date_format: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'YYYY-MM-DD'
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD'
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
    tableName: 'organizations',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeUpdate: (org: Organization) => {
        org.updated_at = new Date();
      }
    },
    indexes: [
      {
        fields: ['company_name']
      }
    ]
  }
);

export default Organization;