import dotenv from 'dotenv';
import { User, Organization } from '../src/models';
import sequelize from '../src/config/database';
import logger from '../src/config/logger';
import { USER_ROLES } from '../src/config/constants';

dotenv.config();

/**
 * Create admin user with organization script
 */
const createAdmin = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    logger.info('Database connected successfully');

    // 1. FIRST: Create or find default organization
    const [organization, orgCreated] = await Organization.findOrCreate({
      where: { company_name: 'DERA CRM' },
      defaults: {
        company_name: 'DERA CRM',
        company_email: process.env.COMPANY_EMAIL || 'info@deracrm.com',
        company_phone: process.env.COMPANY_PHONE || '+1234567890',
        timezone: process.env.TIMEZONE || 'UTC',
        currency: process.env.CURRENCY || 'USD',
        date_format: 'YYYY-MM-DD'
      }
    });

    if (orgCreated) {
      logger.info(`✅ Organization created: ${organization.company_name}`);
    } else {
      logger.info(`📋 Using existing organization: ${organization.company_name}`);
    }

    // 2. THEN: Admin user data with organization_id
    const adminData = {
      email: process.env.ADMIN_EMAIL || 'admin@deracrm.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      first_name: process.env.ADMIN_FIRST_NAME || 'Super',
      last_name: process.env.ADMIN_LAST_NAME || 'Admin',
      role: USER_ROLES.ADMIN,
      is_verified: true,
      organization_id: organization.id  // ✅ Link to the organization
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { email: adminData.email }
    });

    if (existingAdmin) {
      logger.info(`Admin user with email ${adminData.email} already exists`);
      
      // Update their organization if needed
      if (!existingAdmin.organization_id) {
        await existingAdmin.update({ organization_id: organization.id });
        logger.info(`✅ Updated admin with organization ID: ${organization.id}`);
      }
      
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create(adminData);

    logger.info(`
      ======================================
      ✅ Admin user created successfully!
      ======================================
      
      📧 Email: ${admin.email}
      🔑 Password: ${adminData.password}
      👤 Name: ${admin.first_name} ${admin.last_name}
      🎭 Role: ${admin.role}
      🏢 Organization: ${organization.company_name}
      🆔 Organization ID: ${organization.id}
      
      ======================================
      ⚠️  Please change the password after first login!
      ======================================
    `);

    process.exit(0);
  } catch (error) {
    logger.error('Failed to create admin user:', error);
    process.exit(1);
  }
};

// Run the script
createAdmin();