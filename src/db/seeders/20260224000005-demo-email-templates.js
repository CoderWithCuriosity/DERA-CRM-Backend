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

    await queryInterface.bulkInsert('email_templates', [
      {
        name: 'Welcome Email',
        subject: 'Welcome to {{company_name}}!',
        body: '<h1>Hello {{first_name}},</h1><p>Welcome to {{company_name}}! We\'re excited to have you on board.</p>',
        variables: ['first_name', 'company_name'],
        user_id: userId,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Follow-up Email',
        subject: 'Following up on our conversation',
        body: '<h1>Hi {{first_name}},</h1><p>I wanted to follow up on our recent conversation about {{topic}}.</p>',
        variables: ['first_name', 'topic'],
        user_id: userId,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('email_templates', null, {});
  }
};