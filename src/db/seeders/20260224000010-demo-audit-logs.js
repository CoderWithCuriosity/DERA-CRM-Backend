'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get user IDs
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE email = :email',
      {
        replacements: { email: 'admin@deracrm.com' },
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );

    const userId = users[0]?.id;

    if (!userId) return;

    await queryInterface.bulkInsert('audit_logs', [
      {
        user_id: userId,
        action: 'create',
        entity_type: 'contact',
        entity_id: 1,
        details: JSON.stringify({ message: 'Created contact Sarah Johnson' }),
        ip_address: '127.0.0.1',
        user_agent: 'Seeder/1.0',
        created_at: new Date()
      },
      {
        user_id: userId,
        action: 'login',
        entity_type: 'user',
        entity_id: userId,
        details: JSON.stringify({ message: 'User logged in' }),
        ip_address: '127.0.0.1',
        user_agent: 'Seeder/1.0',
        created_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('audit_logs', null, {});
  }
};