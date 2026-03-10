const fs = require('fs');
const path = require('path');

// Ensure migrations directory exists
const migrationsDir = path.join(__dirname, 'src', 'db', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Generate timestamp for migration files
const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '');

// Migration templates
const migrations = [
  {
    name: `create-users-table`,
    up: `
      await queryInterface.createTable('users', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        email: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true
        },
        password: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        first_name: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        last_name: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        role: {
          type: Sequelize.ENUM('admin', 'manager', 'agent'),
          allowNull: false,
          defaultValue: 'agent'
        },
        avatar: {
          type: Sequelize.STRING(500),
          allowNull: true
        },
        is_verified: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        last_login: {
          type: Sequelize.DATE,
          allowNull: true
        },
        organization_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'organizations',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        settings: {
          type: Sequelize.JSONB,
          allowNull: false,
          defaultValue: {
            notifications: true,
            theme: 'light',
            language: 'en'
          }
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await queryInterface.addIndex('users', ['email'], {
        unique: true,
        name: 'users_email_unique'
      });
      await queryInterface.addIndex('users', ['role']);
      await queryInterface.addIndex('users', ['organization_id']);
    `,
    down: `
      await queryInterface.dropTable('users');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
    `
  },
  {
    name: `create-organizations-table`,
    up: `
      await queryInterface.createTable('organizations', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        company_name: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        company_logo: {
          type: Sequelize.STRING(500),
          allowNull: true
        },
        company_email: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        company_phone: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        company_address: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        website: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        timezone: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'UTC'
        },
        date_format: {
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: 'YYYY-MM-DD'
        },
        currency: {
          type: Sequelize.STRING(3),
          allowNull: false,
          defaultValue: 'USD'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await queryInterface.addIndex('organizations', ['company_name']);
    `,
    down: `await queryInterface.dropTable('organizations');`
  },
  {
    name: `create-contacts-table`,
    up: `
      await queryInterface.createTable('contacts', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        first_name: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        last_name: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        email: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        phone: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        company: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        job_title: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        status: {
          type: Sequelize.ENUM('active', 'inactive', 'lead'),
          allowNull: false,
          defaultValue: 'active'
        },
        source: {
          type: Sequelize.ENUM('website', 'referral', 'social', 'email', 'call', 'other'),
          allowNull: false,
          defaultValue: 'other'
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        tags: {
          type: Sequelize.ARRAY(Sequelize.STRING),
          allowNull: false,
          defaultValue: []
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        avatar: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await queryInterface.addIndex('contacts', ['email']);
      await queryInterface.addIndex('contacts', ['status']);
      await queryInterface.addIndex('contacts', ['user_id']);
      await queryInterface.addIndex('contacts', ['company']);
      await queryInterface.addIndex('contacts', ['tags']);
    `,
    down: `
      await queryInterface.dropTable('contacts');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_contacts_status";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_contacts_source";');
    `
  },
  {
    name: `create-deals-table`,
    up: `
      await queryInterface.createTable('deals', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        name: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        contact_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'contacts',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        stage: {
          type: Sequelize.ENUM('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'),
          allowNull: false,
          defaultValue: 'lead'
        },
        amount: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0
        },
        probability: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        expected_close_date: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        actual_close_date: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        status: {
          type: Sequelize.ENUM('open', 'won', 'lost'),
          allowNull: false,
          defaultValue: 'open'
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await queryInterface.addIndex('deals', ['contact_id']);
      await queryInterface.addIndex('deals', ['user_id']);
      await queryInterface.addIndex('deals', ['stage']);
      await queryInterface.addIndex('deals', ['status']);
      await queryInterface.addIndex('deals', ['expected_close_date']);
    `,
    down: `
      await queryInterface.dropTable('deals');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_deals_stage";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_deals_status";');
    `
  },
  {
    name: `create-activities-table`,
    up: `
      await queryInterface.createTable('activities', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        type: {
          type: Sequelize.ENUM('call', 'email', 'meeting', 'task', 'note'),
          allowNull: false
        },
        subject: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        contact_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'contacts',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        deal_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'deals',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        scheduled_date: {
          type: Sequelize.DATE,
          allowNull: false
        },
        completed_date: {
          type: Sequelize.DATE,
          allowNull: true
        },
        duration: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Duration in minutes'
        },
        outcome: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        status: {
          type: Sequelize.ENUM('scheduled', 'completed', 'cancelled'),
          allowNull: false,
          defaultValue: 'scheduled'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await queryInterface.addIndex('activities', ['contact_id']);
      await queryInterface.addIndex('activities', ['deal_id']);
      await queryInterface.addIndex('activities', ['user_id']);
      await queryInterface.addIndex('activities', ['type']);
      await queryInterface.addIndex('activities', ['status']);
      await queryInterface.addIndex('activities', ['scheduled_date']);
    `,
    down: `
      await queryInterface.dropTable('activities');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_activities_type";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_activities_status";');
    `
  },
  {
    name: `create-tickets-table`,
    up: `
      await queryInterface.createTable('tickets', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        ticket_number: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true
        },
        subject: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        contact_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'contacts',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        assigned_to: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        priority: {
          type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
          allowNull: false,
          defaultValue: 'medium'
        },
        status: {
          type: Sequelize.ENUM('new', 'open', 'in_progress', 'resolved', 'closed'),
          allowNull: false,
          defaultValue: 'new'
        },
        due_date: {
          type: Sequelize.DATE,
          allowNull: true
        },
        resolved_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        sla_warnings_sent: {
          type: Sequelize.JSON,
          allowNull: false,
          defaultValue: []
        },
        sla_breach_notified: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await queryInterface.addIndex('tickets', ['ticket_number'], {
        unique: true,
        name: 'tickets_ticket_number_unique'
      });
      await queryInterface.addIndex('tickets', ['contact_id']);
      await queryInterface.addIndex('tickets', ['user_id']);
      await queryInterface.addIndex('tickets', ['assigned_to']);
      await queryInterface.addIndex('tickets', ['status']);
      await queryInterface.addIndex('tickets', ['priority']);
      await queryInterface.addIndex('tickets', ['due_date']);
    `,
    down: `
      await queryInterface.dropTable('tickets');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tickets_priority";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tickets_status";');
    `
  },
  {
    name: `create-ticket-comments-table`,
    up: `
      await queryInterface.createTable('ticket_comments', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        ticket_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'tickets',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        comment: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        is_internal: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await queryInterface.addIndex('ticket_comments', ['ticket_id']);
      await queryInterface.addIndex('ticket_comments', ['user_id']);
      await queryInterface.addIndex('ticket_comments', ['created_at']);
    `,
    down: `await queryInterface.dropTable('ticket_comments');`
  },
  {
    name: `create-email-templates-table`,
    up: `
      await queryInterface.createTable('email_templates', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        name: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true
        },
        subject: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        body: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        variables: {
          type: Sequelize.ARRAY(Sequelize.STRING),
          allowNull: false,
          defaultValue: []
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await queryInterface.addIndex('email_templates', ['name'], {
        unique: true,
        name: 'email_templates_name_unique'
      });
      await queryInterface.addIndex('email_templates', ['user_id']);
    `,
    down: `await queryInterface.dropTable('email_templates');`
  },
  {
    name: `create-campaigns-table`,
    up: `
      await queryInterface.createTable('campaigns', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        name: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        template_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'email_templates',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        status: {
          type: Sequelize.ENUM('draft', 'scheduled', 'sending', 'sent', 'cancelled'),
          allowNull: false,
          defaultValue: 'draft'
        },
        target_count: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        sent_count: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        open_count: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        click_count: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        scheduled_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        sent_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await queryInterface.addIndex('campaigns', ['template_id']);
      await queryInterface.addIndex('campaigns', ['user_id']);
      await queryInterface.addIndex('campaigns', ['status']);
      await queryInterface.addIndex('campaigns', ['scheduled_at']);
    `,
    down: `
      await queryInterface.dropTable('campaigns');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_campaigns_status";');
    `
  },
  {
    name: `create-campaign-recipients-table`,
    up: `
      await queryInterface.createTable('campaign_recipients', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        campaign_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'campaigns',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        contact_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'contacts',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        email: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        status: {
          type: Sequelize.ENUM('pending', 'sent', 'failed', 'opened', 'clicked', 'bounced', 'unsubscribed'),
          allowNull: false,
          defaultValue: 'pending'
        },
        sent_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        opened_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        clicked_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        error_message: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await queryInterface.addIndex('campaign_recipients', ['campaign_id']);
      await queryInterface.addIndex('campaign_recipients', ['contact_id']);
      await queryInterface.addIndex('campaign_recipients', ['status']);
      await queryInterface.addIndex('campaign_recipients', ['campaign_id', 'contact_id'], {
        unique: true,
        name: 'campaign_recipients_campaign_id_contact_id_unique'
      });
    `,
    down: `
      await queryInterface.dropTable('campaign_recipients');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_campaign_recipients_status";');
    `
  },
  {
    name: `create-audit-logs-table`,
    up: `
      await queryInterface.createTable('audit_logs', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        action: {
          type: Sequelize.ENUM('create', 'update', 'delete', 'view', 'export', 'import', 'login', 'logout'),
          allowNull: false
        },
        entity_type: {
          type: Sequelize.ENUM('contact', 'deal', 'ticket', 'activity', 'campaign', 'user', 'organization', 'email_template'),
          allowNull: false
        },
        entity_id: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        details: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        ip_address: {
          type: Sequelize.STRING(45),
          allowNull: true
        },
        user_agent: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await queryInterface.addIndex('audit_logs', ['user_id']);
      await queryInterface.addIndex('audit_logs', ['action']);
      await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id']);
      await queryInterface.addIndex('audit_logs', ['created_at']);
    `,
    down: `
      await queryInterface.dropTable('audit_logs');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_audit_logs_action";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_audit_logs_entity_type";');
    `
  },
  {
    name: `create-refresh-tokens-table`,
    up: `
      await queryInterface.createTable('refresh_tokens', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        token: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        expires_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        revoked: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await queryInterface.addIndex('refresh_tokens', ['token'], {
        unique: true,
        name: 'refresh_tokens_token_unique'
      });
      await queryInterface.addIndex('refresh_tokens', ['user_id']);
      await queryInterface.addIndex('refresh_tokens', ['expires_at']);
      await queryInterface.addIndex('refresh_tokens', ['revoked']);
    `,
    down: `await queryInterface.dropTable('refresh_tokens');`
  },
  {
    name: `create-password-resets-table`,
    up: `
      await queryInterface.createTable('password_resets', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        token: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true
        },
        expires_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        used: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await queryInterface.addIndex('password_resets', ['token'], {
        unique: true,
        name: 'password_resets_token_unique'
      });
      await queryInterface.addIndex('password_resets', ['user_id']);
      await queryInterface.addIndex('password_resets', ['expires_at']);
      await queryInterface.addIndex('password_resets', ['used']);
    `,
    down: `await queryInterface.dropTable('password_resets');`
  },
  {
    name: `create-backups-table`,
    up: `
      await queryInterface.createTable('backups', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        filename: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        path: {
          type: Sequelize.STRING(500),
          allowNull: false
        },
        size: {
          type: Sequelize.BIGINT,
          allowNull: false,
          defaultValue: 0
        },
        status: {
          type: Sequelize.ENUM('pending', 'completed', 'failed'),
          allowNull: false,
          defaultValue: 'pending'
        },
        error_message: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        completed_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      });

      await queryInterface.addIndex('backups', ['status']);
      await queryInterface.addIndex('backups', ['created_at']);
    `,
    down: `
      await queryInterface.dropTable('backups');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_backups_status";');
    `
  }
];

// Generate migration files
migrations.forEach((migration, index) => {
  const fileName = `${timestamp}${String(index + 1).padStart(2, '0')}-${migration.name}.js`;
  const filePath = path.join(migrationsDir, fileName);
  
  const content = `'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    ${migration.up}
  },

  down: async (queryInterface, Sequelize) => {
    ${migration.down}
  }
};
`;

  fs.writeFileSync(filePath, content);
  console.log(`Generated: ${fileName}`);
});

console.log('\n✅ All migration files generated successfully!');
console.log(`📁 Location: ${migrationsDir}`);