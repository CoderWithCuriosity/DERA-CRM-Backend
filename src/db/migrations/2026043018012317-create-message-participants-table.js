'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    
    await queryInterface.createTable('message_participants', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      message_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'messages',
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
        onDelete: 'CASCADE'
      },
      can_receive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      status: {
        type: Sequelize.ENUM('active', 'left', 'hidden'),
        allowNull: false,
        defaultValue: 'active'
      },
      read_at: {
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

    await queryInterface.addIndex('message_participants', ['message_id']);
    await queryInterface.addIndex('message_participants', ['user_id']);
    await queryInterface.addIndex('message_participants', ['status']);
  
  },

  down: async (queryInterface, Sequelize) => {
    
    await queryInterface.dropTable('message_participants');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_message_participants_status";');
  
  }
};
