const pool = require('../config/db');

// Office masters list for granular permissions
const OFFICE_MASTERS = [
  { key: 'user_master', label: 'User Master' },
  { key: 'user_type_master', label: 'User Type Master' },
  { key: 'product_master', label: 'Product Master' },
  { key: 'product_image_master', label: 'Product Image Master' },
  { key: 'activity_report', label: 'Activity Report' },
  { key: 'setting_master', label: 'Setting Master' }
];

const UserTypeModel = {
  /**
   * Create user_types and user_type_permissions tables
   */
  async createTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type_name VARCHAR(100) NOT NULL UNIQUE,
        description VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_type_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_type_id INT NOT NULL,
        master_name VARCHAR(100) NOT NULL,
        can_read TINYINT(1) DEFAULT 0,
        can_write TINYINT(1) DEFAULT 0,
        can_update TINYINT(1) DEFAULT 0,
        can_delete TINYINT(1) DEFAULT 0,
        can_approve TINYINT(1) DEFAULT 0,
        UNIQUE KEY uq_ut_master (user_type_id, master_name),
        FOREIGN KEY (user_type_id) REFERENCES user_types(id) ON DELETE CASCADE
      )
    `);

    await this.seedDefaultTypes();
  },

  /**
   * Seed default user types (Admin, Manager, Staff) if table is empty
   */
  async seedDefaultTypes() {
    try {
      const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM user_types');
      if (rows[0].cnt === 0) {
        // 1. Admin
        const [adminRes] = await pool.query(
          'INSERT INTO user_types (type_name, description) VALUES (?, ?)',
          ['Admin', 'Full administrative access to all modules and masters']
        );
        const adminId = adminRes.insertId;
        const allAdminPerms = OFFICE_MASTERS.map(m => ({
          masterName: m.key,
          canRead: 1,
          canWrite: 1,
          canUpdate: 1,
          canDelete: 1,
          canApprove: 1
        }));
        await this.upsertPermissions(adminId, allAdminPerms);

        // 2. Manager
        const [mgrRes] = await pool.query(
          'INSERT INTO user_types (type_name, description) VALUES (?, ?)',
          ['Manager', 'Operational management of catalog, products, and reports']
        );
        const mgrId = mgrRes.insertId;
        const mgrPerms = [
          { masterName: 'user_master', canRead: 1, canWrite: 0, canUpdate: 0, canDelete: 0, canApprove: 0 },
          { masterName: 'user_type_master', canRead: 1, canWrite: 0, canUpdate: 0, canDelete: 0, canApprove: 0 },
          { masterName: 'product_master', canRead: 1, canWrite: 1, canUpdate: 1, canDelete: 0, canApprove: 1 },
          { masterName: 'product_image_master', canRead: 1, canWrite: 1, canUpdate: 1, canDelete: 0, canApprove: 1 },
          { masterName: 'activity_report', canRead: 1, canWrite: 0, canUpdate: 0, canDelete: 0, canApprove: 0 }
        ];
        await this.upsertPermissions(mgrId, mgrPerms);

        // 3. Staff
        const [staffRes] = await pool.query(
          'INSERT INTO user_types (type_name, description) VALUES (?, ?)',
          ['Staff', 'Standard office staff read access to catalog and products']
        );
        const staffId = staffRes.insertId;
        const staffPerms = [
          { masterName: 'product_master', canRead: 1, canWrite: 0, canUpdate: 0, canDelete: 0, canApprove: 0 },
          { masterName: 'product_image_master', canRead: 1, canWrite: 0, canUpdate: 0, canDelete: 0, canApprove: 0 },
          { masterName: 'activity_report', canRead: 1, canWrite: 0, canUpdate: 0, canDelete: 0, canApprove: 0 }
        ];
        await this.upsertPermissions(staffId, staffPerms);

        console.log('[UserTypeModel] Seeded default user types (Admin, Manager, Staff).');
      }
    } catch (err) {
      console.warn('[UserTypeModel] Seed warning:', err.message);
    }
  },

  /**
   * Get all user types along with their permissions
   */
  async findAll() {
    const [types] = await pool.query(`
      SELECT 
        ut.id, 
        ut.type_name, 
        ut.description, 
        ut.created_at, 
        ut.updated_at,
        COUNT(u.id) as user_count
      FROM user_types ut
      LEFT JOIN users u ON u.user_type_id = ut.id
      GROUP BY ut.id
      ORDER BY ut.id ASC
    `);

    // Fetch permissions for each
    for (const t of types) {
      const [perms] = await pool.query(
        'SELECT master_name, can_read, can_write, can_update, can_delete, can_approve FROM user_type_permissions WHERE user_type_id = ?',
        [t.id]
      );
      t.permissions = perms;
    }

    return types;
  },

  /**
   * Find by ID with permissions
   */
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM user_types WHERE id = ?', [id]);
    if (!rows[0]) return null;

    const userType = rows[0];
    const [perms] = await pool.query(
      'SELECT master_name, can_read, can_write, can_update, can_delete, can_approve FROM user_type_permissions WHERE user_type_id = ?',
      [id]
    );
    userType.permissions = perms;
    return userType;
  },

  /**
   * Create user type
   */
  async create({ type_name, description, permissions = [] }) {
    const [res] = await pool.query(
      'INSERT INTO user_types (type_name, description) VALUES (?, ?)',
      [type_name, description || null]
    );
    const newId = res.insertId;

    if (permissions && permissions.length > 0) {
      await this.upsertPermissions(newId, permissions);
    }

    return this.findById(newId);
  },

  /**
   * Update user type and permissions
   */
  async update(id, { type_name, description, permissions = [] }) {
    await pool.query(
      'UPDATE user_types SET type_name = ?, description = ? WHERE id = ?',
      [type_name, description || null, id]
    );

    if (permissions && permissions.length > 0) {
      await this.upsertPermissions(id, permissions);
    }

    return this.findById(id);
  },

  /**
   * Delete user type
   */
  async delete(id) {
    // Unlink users first
    await pool.query('UPDATE users SET user_type_id = NULL WHERE user_type_id = ?', [id]);
    const [res] = await pool.query('DELETE FROM user_types WHERE id = ?', [id]);
    return res.affectedRows > 0;
  },

  /**
   * Upsert permissions list for a user type
   */
  async upsertPermissions(userTypeId, permissions = []) {
    if (!permissions || permissions.length === 0) return;

    for (const p of permissions) {
      const masterName = p.masterName || p.master_name;
      if (!masterName) continue;

      const canRead = p.canRead ?? p.can_read ? 1 : 0;
      const canWrite = p.canWrite ?? p.can_write ? 1 : 0;
      const canUpdate = p.canUpdate ?? p.can_update ? 1 : 0;
      const canDelete = p.canDelete ?? p.can_delete ? 1 : 0;
      const canApprove = p.canApprove ?? p.can_approve ? 1 : 0;

      await pool.query(`
        INSERT INTO user_type_permissions 
          (user_type_id, master_name, can_read, can_write, can_update, can_delete, can_approve)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          can_read = VALUES(can_read),
          can_write = VALUES(can_write),
          can_update = VALUES(can_update),
          can_delete = VALUES(can_delete),
          can_approve = VALUES(can_approve)
      `, [userTypeId, masterName, canRead, canWrite, canUpdate, canDelete, canApprove]);
    }
  }
};

module.exports = UserTypeModel;
module.exports.OFFICE_MASTERS = OFFICE_MASTERS;

