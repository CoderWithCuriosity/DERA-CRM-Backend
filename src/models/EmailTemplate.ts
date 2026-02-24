import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface EmailTemplateAttributes {
  id: number;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface EmailTemplateCreationAttributes extends Optional<EmailTemplateAttributes, 'id' | 'variables' | 'created_at' | 'updated_at'> {}

class EmailTemplate extends Model<EmailTemplateAttributes, EmailTemplateCreationAttributes> implements EmailTemplateAttributes {
  public id!: number;
  public name!: string;
  public subject!: string;
  public body!: string;
  public variables!: string[];
  public user_id!: number;
  public created_at!: Date;
  public updated_at!: Date;

  // Instance methods
  public renderPreview(data: Record<string, any>): { subject: string; body: string } {
    let renderedSubject = this.subject;
    let renderedBody = this.body;

    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      renderedSubject = renderedSubject.replace(regex, value);
      renderedBody = renderedBody.replace(regex, value);
    });

    return { subject: renderedSubject, body: renderedBody };
  }

  public toJSON() {
    const values = { ...this.get() };
    return values;
  }
}

EmailTemplate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    variables: {
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
    tableName: 'email_templates',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeUpdate: (template: EmailTemplate) => {
        template.updated_at = new Date();
        
        // Extract variables from body and subject
        const allText = `${template.subject} ${template.body}`;
        const matches = allText.match(/\{\{([^}]+)\}\}/g) || [];
        template.variables = [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];
      }
    },
    indexes: [
      {
        unique: true,
        fields: ['name']
      },
      {
        fields: ['user_id']
      }
    ]
  }
);

export default EmailTemplate;