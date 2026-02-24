'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123!', salt);

    await queryInterface.bulkInsert('users', [
      {
        email: 'admin@deracrm.com',
        password: hashedPassword,
        first_name: 'Super',
        last_name: 'Admin',
        role: 'admin',
        is_verified: true,
        settings: JSON.stringify({
          notifications: true,
          theme: 'light',
          language: 'en'
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        email: 'manager@deracrm.com',
        password: hashedPassword,
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'manager',
        is_verified: true,
        settings: JSON.stringify({
          notifications: true,
          theme: 'light',
          language: 'en'
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        email: 'agent@deracrm.com',
        password: hashedPassword,
        first_name: 'John',
        last_name: 'Doe',
        role: 'agent',
        is_verified: true,
        settings: JSON.stringify({
          notifications: true,
          theme: 'light',
          language: 'en'
        }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  }
};