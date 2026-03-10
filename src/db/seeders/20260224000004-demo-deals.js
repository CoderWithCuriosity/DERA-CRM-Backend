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
      'SELECT id, email FROM contacts WHERE email IN (:emails)',
      {
        replacements: { emails: ['sarah.johnson@example.com', 'michael.chen@example.com'] },
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );

    const userId = users[0]?.id;
    if (!userId || contacts.length === 0) return;

    const sarahContact = contacts.find(c => c.email === 'sarah.johnson@example.com');
    const michaelContact = contacts.find(c => c.email === 'michael.chen@example.com');

    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);

    await queryInterface.bulkInsert('deals', [
      {
        name: 'Enterprise Software License',
        contact_id: sarahContact.id,
        user_id: userId,
        stage: 'negotiation',
        amount: 50000.00,
        probability: 75,
        expected_close_date: futureDate,
        status: 'open',
        notes: 'Interested in 3-year enterprise license',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Consulting Services',
        contact_id: michaelContact.id,
        user_id: userId,
        stage: 'proposal',
        amount: 15000.00,
        probability: 50,
        expected_close_date: futureDate,
        status: 'open',
        notes: 'Initial consultation completed, proposal sent',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('deals', null, {});
  }
};