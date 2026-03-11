import dotenv from 'dotenv';
import { User } from '../src/models';
import sequelize from '../src/config/database';
import logger from '../src/config/logger';
import { USER_ROLES } from '../src/config/constants';

dotenv.config();

/**
 * Create admin user script
 * Usage: npm run create:admin
 */
const createAdmin = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    logger.info('Database connected successfully');

    // Admin user data
    const adminData = {
      email: process.env.ADMIN_EMAIL || 'admin@deracrm.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      first_name: process.env.ADMIN_FIRST_NAME || 'Super',
      last_name: process.env.ADMIN_LAST_NAME || 'Admin',
      role: USER_ROLES.ADMIN,
      is_verified: true
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { email: adminData.email }
    });

    if (existingAdmin) {
      logger.info(`Admin user with email ${adminData.email} already exists`);
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create(adminData);

    logger.info(`
      ✅ Admin user created successfully!
      
      📧 Email: ${admin.email}
      🔑 Password: ${adminData.password}
      👤 Name: ${admin.first_name} ${admin.last_name}
      🎭 Role: ${admin.role}
      
      ⚠️  Please change the password after first login!
    `);

    process.exit(0);
  } catch (error) {
    logger.error('Failed to create admin user:', error);
    process.exit(1);
  }
};

// Run the script
createAdmin();