'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    
      await queryInterface.createTable('deals', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        name: {
          type: Sequelize.STRING(255),
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
        stage: {
          type: Sequelize.ENUM('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'),
          allowNull: false,
          defaultValue: 'lead'
        },
        amount: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0
        },
        probability: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0,
            max: 100
          }
        },
        expected_close_date: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        actual_close_date: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        status: {
          type: Sequelize.ENUM('open', 'won', 'lost'),
          allowNull: false,
          defaultValue: 'open'
        },
        notes: {
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

      await queryInterface.addIndex('deals', ['contact_id']);
      await queryInterface.addIndex('deals', ['user_id']);
      await queryInterface.addIndex('deals', ['stage']);
      await queryInterface.addIndex('deals', ['status']);
      await queryInterface.addIndex('deals', ['expected_close_date']);
    
  },

  down: async (queryInterface, Sequelize) => {
    
      await queryInterface.dropTable('deals');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_deals_stage";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_deals_status";');
    
  }
};
