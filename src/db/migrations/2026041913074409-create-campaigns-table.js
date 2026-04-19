'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    
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
    
  },

  down: async (queryInterface, Sequelize) => {
    
      await queryInterface.dropTable('campaigns');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_campaigns_status";');
    
  }
};
