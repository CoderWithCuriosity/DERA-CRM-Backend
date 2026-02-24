'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
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
        type: Sequelize.ENUM('website', 'referral', 'social', 'email', 'call', 'event', 'other'),
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
        onDelete: 'CASCADE'
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('contacts');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_contacts_status;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_contacts_source;');
  }
};