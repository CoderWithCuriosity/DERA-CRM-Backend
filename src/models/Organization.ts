import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import {
    OrganizationAttributes,
    OrganizationCreationAttributes,
} from '../types/models';
import {
    PipelineStage,
    TicketStatusConfig,
    TicketPriorityConfig,
    OrganizationSettings
} from '../types/index';

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
    public pipeline_stages!: PipelineStage[];
    public ticket_statuses!: TicketStatusConfig[];
    public ticket_priorities!: TicketPriorityConfig[];
    public settings!: OrganizationSettings;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Organization.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        company_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: 'My Company'
        },
        company_logo: {
            type: DataTypes.TEXT
        },
        company_email: {
            type: DataTypes.STRING(255),
            validate: {
                isEmail: true
            }
        },
        company_phone: {
            type: DataTypes.STRING(50)
        },
        company_address: {
            type: DataTypes.TEXT
        },
        website: {
            type: DataTypes.STRING(255)
        },
        timezone: {
            type: DataTypes.STRING(50),
            defaultValue: 'UTC'
        },
        date_format: {
            type: DataTypes.STRING(20),
            defaultValue: 'MM/DD/YYYY'
        },
        currency: {
            type: DataTypes.STRING(3),
            defaultValue: 'USD'
        },
        pipeline_stages: {
            type: DataTypes.JSONB,
            defaultValue: [
                { name: 'lead', display_name: 'Lead', probability: 10, color: '#3B82F6' },
                { name: 'qualified', display_name: 'Qualified', probability: 25, color: '#8B5CF6' },
                { name: 'proposal', display_name: 'Proposal', probability: 50, color: '#F59E0B' },
                { name: 'negotiation', display_name: 'Negotiation', probability: 75, color: '#EF4444' },
                { name: 'won', display_name: 'Won', probability: 100, color: '#10B981' },
                { name: 'lost', display_name: 'Lost', probability: 0, color: '#6B7280' }
            ]
        },
        ticket_statuses: {
            type: DataTypes.JSONB,
            defaultValue: [
                { name: 'new', display_name: 'New', color: '#3B82F6' },
                { name: 'open', display_name: 'Open', color: '#F59E0B' },
                { name: 'pending', display_name: 'Pending', color: '#8B5CF6' },
                { name: 'resolved', display_name: 'Resolved', color: '#10B981' },
                { name: 'closed', display_name: 'Closed', color: '#6B7280' }
            ]
        },
        ticket_priorities: {
            type: DataTypes.JSONB,
            defaultValue: [
                { name: 'low', display_name: 'Low', color: '#6B7280', sla_response: 48, sla_resolution: 120 },
                { name: 'medium', display_name: 'Medium', color: '#3B82F6', sla_response: 24, sla_resolution: 72 },
                { name: 'high', display_name: 'High', color: '#F59E0B', sla_response: 8, sla_resolution: 24 },
                { name: 'urgent', display_name: 'Urgent', color: '#EF4444', sla_response: 1, sla_resolution: 4 }
            ]
        },
        settings: {
            type: DataTypes.JSONB,
            defaultValue: {
                allow_duplicate_contacts: false,
                require_contact_for_deal: true,
                default_deal_probability: 10,
                auto_assign_tickets: false,
                email_tracking: true,
                email_footer: '',
                date_format: 'MM/DD/YYYY',
                time_format: '12h'
            }
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        sequelize,
        tableName: 'organizations',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

export default Organization;