'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    
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
          allowNull: false,
          validate: {
            isEmail: true
          }
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
    
  },

  down: async (queryInterface, Sequelize) => {
    
      await queryInterface.dropTable('campaign_recipients');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_campaign_recipients_status";');
    
  }
};
