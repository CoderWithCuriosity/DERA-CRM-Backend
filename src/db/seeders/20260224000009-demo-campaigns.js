'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get user and template IDs
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE email = :email',
      {
        replacements: { email: 'agent@deracrm.com' },
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );

    const templates = await queryInterface.sequelize.query(
      'SELECT id FROM email_templates WHERE name = :name',
      {
        replacements: { name: 'Welcome Email' },
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );

    const userId = users[0]?.id;
    const templateId = templates[0]?.id;

    if (!userId || !templateId) return;

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 1);

    await queryInterface.bulkInsert('campaigns', [
      {
        name: 'Welcome Campaign - Q1 2025',
        template_id: templateId,
        user_id: userId,
        status: 'scheduled',
        target_count: 100,
        sent_count: 0,
        open_count: 0,
        click_count: 0,
        scheduled_at: scheduledDate,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('campaigns', null, {});
  }
};