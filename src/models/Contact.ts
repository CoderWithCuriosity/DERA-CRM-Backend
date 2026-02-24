import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { CONTACT_STATUS, CONTACT_SOURCES, ContactStatus, ContactSource } from '../config/constants';

export interface ContactAttributes {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  status: ContactStatus;
  source: ContactSource;
  notes: string | null;
  tags: string[];
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface ContactCreationAttributes extends Optional<ContactAttributes, 'id' | 'phone' | 'company' | 'job_title' | 'notes' | 'tags' | 'created_at' | 'updated_at'> {}

class Contact extends Model<ContactAttributes, ContactCreationAttributes> implements ContactAttributes {
  public id!: number;
  public first_name!: string;
  public last_name!: string;
  public email!: string;
  public phone!: string | null;
  public company!: string | null;
  public job_title!: string | null;
  public status!: ContactStatus;
  public source!: ContactSource;
  public notes!: string | null;
  public tags!: string[];
  public user_id!: number;
  public created_at!: Date;
  public updated_at!: Date;

  // Virtual fields
  public get fullName(): string {
    return `${this.first_name} ${this.last_name}`;
  }

  public toJSON() {
    const values = { ...this.get() };
    return values;
  }
}

Contact.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    company: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    job_title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM(...Object.values(CONTACT_STATUS)),
      allowNull: false,
      defaultValue: CONTACT_STATUS.ACTIVE
    },
    source: {
      type: DataTypes.ENUM(...Object.values(CONTACT_SOURCES)),
      allowNull: false,
      defaultValue: CONTACT_SOURCES.OTHER
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: []
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
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
    tableName: 'contacts',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeUpdate: (contact: Contact) => {
        contact.updated_at = new Date();
      }
    },
    indexes: [
      {
        fields: ['email']
      },
      {
        fields: ['status']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['company']
      },
      {
        fields: ['tags']
      }
    ]
  }
);

export default Contact;