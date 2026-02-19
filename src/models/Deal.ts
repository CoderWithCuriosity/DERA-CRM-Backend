import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { DealAttributes, DealCreationAttributes } from '../types/models';
import User from './User';
import Contact from './Contact';

class Deal extends Model<DealAttributes, DealCreationAttributes> implements DealAttributes {
    public id!: number;
    public user_id!: number;
    public contact_id!: number | null;
    public name!: string;
    public stage!: string;
    public amount!: number | null;
    public probability!: number;
    public expected_close_date!: Date | null;
    public actual_close_date!: Date | null;
    public status!: 'open' | 'won' | 'lost';
    public loss_reason!: string | null;
    public notes!: string | null;
    public custom_fields!: Record<string, any>;
    
    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Virtuals
    public get weighted_amount(): number | null {
        if (this.amount && this.probability) {
            return (this.amount * this.probability) / 100;
        }
        return null;
    }
}

Deal.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        contact_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'contacts',
                key: 'id'
            }
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        stage: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'lead'
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2)
        },
        probability: {
            type: DataTypes.INTEGER,
            defaultValue: 10,
            validate: {
                min: 0,
                max: 100
            }
        },
        expected_close_date: {
            type: DataTypes.DATEONLY
        },
        actual_close_date: {
            type: DataTypes.DATEONLY
        },
        status: {
            type: DataTypes.ENUM('open', 'won', 'lost'),
            defaultValue: 'open'
        },
        loss_reason: {
            type: DataTypes.STRING(255)
        },
        notes: {
            type: DataTypes.TEXT
        },
        custom_fields: {
            type: DataTypes.JSONB,
            defaultValue: {}
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
        tableName: 'deals',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['user_id']
            },
            {
                fields: ['contact_id']
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

// Associations
Deal.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });
Deal.belongsTo(Contact, { foreignKey: 'contact_id' });

export default Deal;