'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('activities', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      type: {
        type: Sequelize.ENUM('call', 'email', 'meeting', 'task', 'note', 'follow-up'),
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
        onDelete: 'CASCADE'
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
        type: Sequelize.ENUM('scheduled', 'completed', 'cancelled', 'overdue'),
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('activities');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_activities_type;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_activities_status;');
  }
};