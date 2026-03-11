'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    
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
    
  },

  down: async (queryInterface, Sequelize) => {
    
      await queryInterface.dropTable('backups');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_backups_status";');
    
  }
};
