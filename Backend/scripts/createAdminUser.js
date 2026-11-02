const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { testConnection } = require('../config/db');
const UserModel = require('../models/userModel');
const UserTypeModel = require('../models/userTypeModel');

async function createAdminUser() {
  console.log('========================================================');
  console.log('👤 Setting Up Admin User (username: admin / password: admin)');
  console.log('========================================================');

  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Could not connect to MySQL. Ensure MySQL is running and check .env.');
    process.exit(1);
  }

  try {
    // 1. Ensure user_types and users tables exist
    await UserTypeModel.createTable();
    await UserModel.createTable();

    // 2. Fetch Admin user_type_id
    let adminTypeId = null;
    try {
      const [typeRows] = await pool.query("SELECT id FROM user_types WHERE type_name = 'Admin' LIMIT 1");
      if (typeRows.length > 0) {
        adminTypeId = typeRows[0].id;
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch user_type_id:', err.message);
    }

    // 3. Hash the password 'admin'
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin', salt);

    // 4. Check if a user with username 'admin' or email 'admin@pharsyde.com' already exists
    const [existingUsers] = await pool.query(
      'SELECT id, username, email FROM users WHERE username = ? OR email = ? LIMIT 1',
      ['admin', 'admin@pharsyde.com']
    );

    let userId;
    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      console.log(`ℹ️ User found (ID: ${userId}). Updating credentials to username: admin / password: admin...`);

      await pool.query(
        `UPDATE users 
         SET username = 'admin',
             password = ?,
             role = 'admin',
             user_type = 'Admin',
             user_type_id = COALESCE(?, user_type_id),
             active = 1
         WHERE id = ?`,
        [hashedPassword, adminTypeId, userId]
      );
    } else {
      console.log('ℹ️ No existing admin user found. Creating new admin user...');
      const [insertResult] = await pool.query(
        `INSERT INTO users (name, username, email, password, role, user_type, user_type_id, active, date_of_join)
         VALUES (?, ?, ?, ?, 'admin', 'Admin', ?, 1, CURDATE())`,
        ['Administrator', 'admin', 'admin@pharsyde.com', hashedPassword, adminTypeId]
      );
      userId = insertResult.insertId;
    }

    // 5. Verification
    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = userRows[0];

    const isMatch = await bcrypt.compare('admin', user.password);

    console.log('========================================================');
    if (isMatch) {
      console.log('✅ Admin user created/updated successfully!');
      console.log(`   👤 ID:        ${user.id}`);
      console.log(`   🏷️  Name:      ${user.name}`);
      console.log(`   🔑 Username:  ${user.username}`);
      console.log(`   📧 Email:     ${user.email}`);
      console.log(`   🔒 Password:  admin`);
      console.log(`   🛡️  Role:      ${user.role}`);
      console.log(`   🏢 User Type: ${user.user_type} (ID: ${user.user_type_id || 'N/A'})`);
      console.log(`   🟢 Active:    ${user.active ? 'Yes' : 'No'}`);
    } else {
      console.error('❌ Password verification check failed.');
    }
    console.log('========================================================');
  } catch (error) {
    console.error(`❌ Error setting up admin user: ${error.message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createAdminUser();

