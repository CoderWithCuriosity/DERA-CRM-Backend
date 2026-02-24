'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get user and contact IDs
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE email = :email',
      {
        replacements: { email: 'agent@deracrm.com' },
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );

    const contacts = await queryInterface.sequelize.query(
      'SELECT id FROM contacts WHERE email = :email',
      {
        replacements: { email: 'sarah.johnson@example.com' },
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );

    const userId = users[0]?.id;
    const contactId = contacts[0]?.id;

    if (!userId || !contactId) return;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);

    await queryInterface.bulkInsert('tickets', [
      {
        ticket_number: 'TKT-2025-0001',
        subject: 'Cannot access premium features',
        description: 'User upgraded to premium but features are still locked',
        contact_id: contactId,
        user_id: userId,
        assigned_to: userId,
        priority: 'high',
        status: 'open',
        due_date: futureDate,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('tickets', null, {});
  }
};