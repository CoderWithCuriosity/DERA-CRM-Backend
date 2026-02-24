'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get user IDs
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE email = :email',
      {
        replacements: { email: 'agent@deracrm.com' },
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );

    const userId = users[0]?.id;

    if (!userId) return;

    await queryInterface.bulkInsert('contacts', [
      {
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@example.com',
        phone: '+1234567890',
        company: 'Tech Solutions Ltd',
        job_title: 'Marketing Director',
        status: 'active',
        source: 'website',
        notes: 'Met at tech conference, interested in enterprise plan',
        tags: ['tech', 'marketing', 'lead'],
        user_id: userId,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        first_name: 'Michael',
        last_name: 'Chen',
        email: 'michael.chen@example.com',
        phone: '+1987654321',
        company: 'Innovate LLC',
        job_title: 'CEO',
        status: 'lead',
        source: 'referral',
        notes: 'Referred by existing customer',
        tags: ['tech', 'c-level'],
        user_id: userId,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        first_name: 'Emily',
        last_name: 'Davis',
        email: 'emily.davis@example.com',
        phone: '+1122334455',
        company: 'Startup Co',
        job_title: 'Product Manager',
        status: 'active',
        source: 'social',
        tags: ['tech', 'product'],
        user_id: userId,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('contacts', null, {});
  }
};