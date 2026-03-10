'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get user and ticket IDs
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE email = :email',
      {
        replacements: { email: 'agent@deracrm.com' },
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );

    const tickets = await queryInterface.sequelize.query(
      'SELECT id FROM tickets WHERE subject LIKE :subject',
      {
        replacements: { subject: '%premium features%' },
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );

    const userId = users[0]?.id;
    const ticketId = tickets[0]?.id;

    if (!userId || !ticketId) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await queryInterface.bulkInsert('ticket_comments', [
      {
        ticket_id: ticketId,
        user_id: userId,
        comment: 'Asked customer to clear cache and try again',
        is_internal: false,
        created_at: yesterday,
        updated_at: yesterday
      },
      {
        ticket_id: ticketId,
        user_id: userId,
        comment: 'Customer still experiencing issues. Escalating to dev team.',
        is_internal: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('ticket_comments', null, {});
  }
};