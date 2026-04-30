import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ContactAttachmentAttributes {
  id: number;
  contact_id: number;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  file_type: 'image' | 'video' | 'audio' | 'document' | 'other';
  uploaded_by: number;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ContactAttachmentCreationAttributes extends Optional<ContactAttachmentAttributes, 'id' | 'description' | 'created_at' | 'updated_at'> {}

class ContactAttachment extends Model<ContactAttachmentAttributes, ContactAttachmentCreationAttributes> implements ContactAttachmentAttributes {
  public id!: number;
  public contact_id!: number;
  public filename!: string;
  public original_name!: string;
  public file_path!: string;
  public file_size!: number;
  public mime_type!: string;
  public file_type!: 'image' | 'video' | 'audio' | 'document' | 'other';
  public uploaded_by!: number;
  public description!: string | null;
  public created_at!: Date;
  public updated_at!: Date;
}

ContactAttachment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    contact_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'contacts',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    original_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    file_type: {
      type: DataTypes.ENUM('image', 'video', 'audio', 'document', 'other'),
      allowNull: false
    },
    uploaded_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    description: {
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
    tableName: 'contact_attachments',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeUpdate: (attachment: ContactAttachment) => {
        attachment.updated_at = new Date();
      }
    },
    indexes: [
      {
        fields: ['contact_id']
      },
      {
        fields: ['uploaded_by']
      },
      {
        fields: ['file_type']
      }
    ]
  }
);

export default ContactAttachment;