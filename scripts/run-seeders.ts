#!/usr/bin/env node

import { execSync } from 'child_process';

const seeders = [
  '20260224000001-demo-users.js',
  '20260224000002-demo-organizations.js',
  '20260224000003-demo-contacts.js',
  '20260224000004-demo-deals.js',
  '20260224000005-demo-activities.js',
  '20260224000006-demo-tickets.js',
  '20260224000007-demo-ticket-comments.js',
  '20260224000008-demo-email-templates.js',
  '20260224000009-demo-campaigns.js',
  '20260224000010-demo-audit-logs.js'
];

console.log('🌱 Running seeders in order...\n');

seeders.forEach((seeder, index) => {
  console.log(`[${index + 1}/${seeders.length}] Running: ${seeder}`);
  try {
    execSync(`npx sequelize-cli db:seed --seed ${seeder}`, { stdio: 'inherit' });
    console.log(`✅ Completed: ${seeder}\n`);
  } catch (error) {
    console.error(`❌ Failed: ${seeder}`);
    process.exit(1);
  }
});

console.log('🎉 All seeders completed successfully!');