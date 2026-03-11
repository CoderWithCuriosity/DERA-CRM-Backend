'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    
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
    
  },

  down: async (queryInterface, Sequelize) => {
    
      await queryInterface.dropTable('ticket_comments');
    
  }
};
