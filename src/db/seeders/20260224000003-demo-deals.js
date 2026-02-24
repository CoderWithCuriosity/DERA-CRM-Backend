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
    futureDate.setDate(futureDate.getDate() + 30);

    await queryInterface.bulkInsert('deals', [
      {
        name: 'Enterprise Plan - Tech Solutions',
        contact_id: contactId,
        user_id: userId,
        stage: 'negotiation',
        amount: 16500.00,
        probability: 80,
        expected_close_date: futureDate,
        status: 'open',
        notes: 'Added premium support package',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Basic Plan - Innovate LLC',
        contact_id: contactId,
        user_id: userId,
        stage: 'qualified',
        amount: 5000.00,
        probability: 40,
        expected_close_date: futureDate,
        status: 'open',
        notes: 'Interested in basic features',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('deals', null, {});
  }
};