'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    
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
    
  },

  down: async (queryInterface, Sequelize) => {
    
      await queryInterface.dropTable('tickets');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tickets_priority";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tickets_status";');
    
  }
};
