import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { TICKET_STATUS, PRIORITIES, TicketStatus, Priority } from '../config/constants';

export interface TicketAttributes {
  id: number;
  ticket_number: string;
  subject: string;
  description: string;
  contact_id: number;
  user_id: number;
  assigned_to: number | null;
  priority: Priority;
  status: TicketStatus;
  due_date: Date | null;
  resolved_at: Date | null;
  sla_warnings_sent: number[]; // Track which warning thresholds have been sent
  sla_breach_notified: boolean; // Track if breach notification was sent
  created_at: Date;
  updated_at: Date;
}

export interface TicketCreationAttributes extends Optional<TicketAttributes, 'id' | 'ticket_number' | 'assigned_to' | 'due_date' | 'resolved_at' | 'sla_warnings_sent' | 'sla_breach_notified'| 'created_at' | 'updated_at'> {}

class Ticket extends Model<TicketAttributes, TicketCreationAttributes> implements TicketAttributes {
  public id!: number;
  public ticket_number!: string;
  public subject!: string;
  public description!: string;
  public contact_id!: number;
  public user_id!: number;
  public assigned_to!: number | null;
  public priority!: Priority;
  public status!: TicketStatus;
  public due_date!: Date | null;
  public resolved_at!: Date | null;
  public sla_warnings_sent!: number[];
  public sla_breach_notified!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  // Virtual fields
  public get responseTime(): number | null {
    // Calculate response time in minutes
    return null; // Implement based on first comment
  }

  public get resolutionTime(): number | null {
    if (!this.resolved_at) return null;
    return Math.floor((this.resolved_at.getTime() - this.created_at.getTime()) / 60000);
  }

  public get isOverdue(): boolean {
    if (!this.due_date || this.status === TICKET_STATUS.RESOLVED || this.status === TICKET_STATUS.CLOSED) {
      return false;
    }
    return new Date() > new Date(this.due_date);
  }

  public toJSON() {
    const values = { ...this.get() };
    return values;
  }
}

Ticket.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    ticket_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
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
      allowNull: false
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
    assigned_to: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    priority: {
      type: DataTypes.ENUM(...Object.values(PRIORITIES)),
      allowNull: false,
      defaultValue: PRIORITIES.MEDIUM
    },
    status: {
      type: DataTypes.ENUM(...Object.values(TICKET_STATUS)),
      allowNull: false,
      defaultValue: TICKET_STATUS.NEW
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sla_warnings_sent: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    sla_breach_notified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
    tableName: 'tickets',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeUpdate: (ticket: Ticket) => {
        ticket.updated_at = new Date();
        
        // Set resolved_at when status changes to resolved
        if (ticket.status === TICKET_STATUS.RESOLVED && !ticket.resolved_at) {
          ticket.resolved_at = new Date();
        }
      }
    },
    indexes: [
      {
        unique: true,
        fields: ['ticket_number']
      },
      {
        fields: ['contact_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['assigned_to']
      },
      {
        fields: ['status']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['due_date']
      }
    ]
  }
);

export default Ticket;