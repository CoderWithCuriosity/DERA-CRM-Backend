'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('organizations');
  }
};