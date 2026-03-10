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
      'SELECT id FROM contacts WHERE email IN (:emails)',
      {
        replacements: { emails: ['sarah.johnson@example.com', 'emily.davis@example.com'] },
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );

    const userId = users[0]?.id;
    if (!userId || contacts.length === 0) return;

    const sarahContact = contacts[0];
    const emilyContact = contacts[1] || contacts[0];

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    await queryInterface.bulkInsert('tickets', [
      {
        ticket_number: `TKT-${today.getFullYear()}-0001`,
        subject: 'Cannot access premium features',
        description: 'User upgraded to premium but features are still locked. They have tried logging out and back in.',
        contact_id: sarahContact.id,
        user_id: userId,
        assigned_to: userId,
        priority: 'high',
        status: 'open',
        due_date: tomorrow,
        sla_warnings_sent: JSON.stringify([]),
        sla_breach_notified: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        ticket_number: `TKT-${today.getFullYear()}-0002`,
        subject: 'Billing discrepancy',
        description: 'Customer was charged twice for monthly subscription',
        contact_id: emilyContact.id,
        user_id: userId,
        assigned_to: null,
        priority: 'urgent',
        status: 'new',
        due_date: tomorrow,
        sla_warnings_sent: JSON.stringify([]),
        sla_breach_notified: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        ticket_number: `TKT-${today.getFullYear()}-0003`,
        subject: 'Feature request: API integration',
        description: 'Customer would like to integrate with their internal CRM',
        contact_id: sarahContact.id,
        user_id: userId,
        assigned_to: userId,
        priority: 'low',
        status: 'in_progress',
        due_date: nextWeek,
        sla_warnings_sent: JSON.stringify([]),
        sla_breach_notified: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('tickets', null, {});
  }
};