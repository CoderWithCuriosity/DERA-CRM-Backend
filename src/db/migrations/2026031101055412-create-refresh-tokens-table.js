'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    
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
    
  },

  down: async (queryInterface, Sequelize) => {
    
      await queryInterface.dropTable('refresh_tokens');
    
  }
};
