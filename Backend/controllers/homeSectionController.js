const HomeSectionModel = require('../models/homeSectionModel');
const ProductModel = require('../models/productModel');
const AuditLogModel = require('../models/auditLogModel');

/**
 * @route   GET /api/office/home-sections
 * @desc    Get all home page sections for admin management
 * @access  Private (Office)
 */
const getAdminSections = async (req, res, next) => {
  try {
    const sections = await HomeSectionModel.findAll({ activeOnly: false });
    res.status(200).json({
      success: true,
      count: sections.length,
      sections,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/office/home-sections
 * @desc    Create a new home page section
 * @access  Private (Office)
 */
const createSection = async (req, res, next) => {
  try {
    const { heading, sub_heading, product_ids, display_order, active } = req.body;

    if (!heading || !heading.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Section heading is required',
      });
    }

    const newSection = await HomeSectionModel.create({
      heading,
      sub_heading: sub_heading || '',
      product_ids: Array.isArray(product_ids) ? product_ids : [],
      display_order: display_order !== undefined ? Number(display_order) : null,
      active: active !== undefined ? (active ? 1 : 0) : 1,
    });

    // Audit log (safe invocation)
    try {
      if (typeof AuditLogModel.logAction === 'function') {
        await AuditLogModel.logAction(req, {
          action: 'CREATE',
          masterName: 'home_section_master',
          recordId: newSection.id,
          details: {
            heading: newSection.heading,
            sub_heading: newSection.sub_heading,
            productCount: newSection.product_ids.length,
            display_order: newSection.display_order,
          },
        });
      } else if (typeof AuditLogModel.log === 'function') {
        await AuditLogModel.log({
          userId: req.user?.id || null,
          username: req.user?.name || req.user?.email || 'Office User',
          masterName: 'home_section_master',
          changeType: 'CREATE',
          afterData: { recordId: newSection.id, heading: newSection.heading },
          ipAddress: req.ip || req.connection?.remoteAddress,
        });
      }
    } catch (auditErr) {
      console.warn('[homeSectionController] Audit log failed (non-critical):', auditErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Home section created successfully',
      section: newSection,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/office/home-sections/:id
 * @desc    Update a home page section
 * @access  Private (Office)
 */
const updateSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await HomeSectionModel.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Home section with ID ${id} not found`,
      });
    }

    const { heading, sub_heading, product_ids, display_order, active } = req.body;

    if (heading !== undefined && !heading.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Section heading cannot be empty',
      });
    }

    const updated = await HomeSectionModel.update(id, {
      heading,
      sub_heading,
      product_ids,
      display_order,
      active,
    });

    // Audit log (safe invocation)
    try {
      if (typeof AuditLogModel.logAction === 'function') {
        await AuditLogModel.logAction(req, {
          action: 'UPDATE',
          masterName: 'home_section_master',
          recordId: updated.id,
          details: {
            heading: updated.heading,
            sub_heading: updated.sub_heading,
            productCount: updated.product_ids.length,
            display_order: updated.display_order,
            active: updated.active,
          },
        });
      } else if (typeof AuditLogModel.log === 'function') {
        await AuditLogModel.log({
          userId: req.user?.id || null,
          username: req.user?.name || req.user?.email || 'Office User',
          masterName: 'home_section_master',
          changeType: 'UPDATE',
          afterData: { recordId: updated.id, heading: updated.heading },
          ipAddress: req.ip || req.connection?.remoteAddress,
        });
      }
    } catch (auditErr) {
      console.warn('[homeSectionController] Audit log failed (non-critical):', auditErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Home section updated successfully',
      section: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/office/home-sections/:id/toggle-active
 * @desc    Toggle section active status
 * @access  Private (Office)
 */
const toggleSectionActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await HomeSectionModel.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Home section with ID ${id} not found`,
      });
    }

    const updated = await HomeSectionModel.toggleActive(id);

    // Audit log (safe invocation)
    try {
      if (typeof AuditLogModel.logAction === 'function') {
        await AuditLogModel.logAction(req, {
          action: 'TOGGLE_ACTIVE',
          masterName: 'home_section_master',
          recordId: updated.id,
          details: { active: updated.active, heading: updated.heading },
        });
      } else if (typeof AuditLogModel.log === 'function') {
        await AuditLogModel.log({
          userId: req.user?.id || null,
          username: req.user?.name || req.user?.email || 'Office User',
          masterName: 'home_section_master',
          changeType: 'TOGGLE_ACTIVE',
          afterData: { recordId: updated.id, active: updated.active },
          ipAddress: req.ip || req.connection?.remoteAddress,
        });
      }
    } catch (auditErr) {
      console.warn('[homeSectionController] Audit log failed (non-critical):', auditErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Section is now ${updated.active ? 'active' : 'inactive'}`,
      section: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/office/home-sections/:id
 * @desc    Delete a home page section
 * @access  Private (Office)
 */
const deleteSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await HomeSectionModel.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Home section with ID ${id} not found`,
      });
    }

    await HomeSectionModel.delete(id);

    // Audit log (safe invocation)
    try {
      if (typeof AuditLogModel.logAction === 'function') {
        await AuditLogModel.logAction(req, {
          action: 'DELETE',
          masterName: 'home_section_master',
          recordId: id,
          details: { heading: existing.heading },
        });
      } else if (typeof AuditLogModel.log === 'function') {
        await AuditLogModel.log({
          userId: req.user?.id || null,
          username: req.user?.name || req.user?.email || 'Office User',
          masterName: 'home_section_master',
          changeType: 'DELETE',
          afterData: { recordId: id, heading: existing.heading },
          ipAddress: req.ip || req.connection?.remoteAddress,
        });
      }
    } catch (auditErr) {
      console.warn('[homeSectionController] Audit log failed (non-critical):', auditErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Home section deleted successfully',
      id: Number(id),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/office/home-sections/reorder
 * @desc    Reorder sections in batch
 * @access  Private (Office)
 */
const reorderSections = async (req, res, next) => {
  try {
    const { orderList } = req.body;

    if (!Array.isArray(orderList)) {
      return res.status(400).json({
        success: false,
        message: 'orderList must be an array of section IDs or { id, display_order } items',
      });
    }

    await HomeSectionModel.reorder(orderList);

    const sections = await HomeSectionModel.findAll({ activeOnly: false });

    // Audit log (safe invocation)
    try {
      if (typeof AuditLogModel.logAction === 'function') {
        await AuditLogModel.logAction(req, {
          action: 'REORDER',
          masterName: 'home_section_master',
          details: { reorderedCount: orderList.length },
        });
      } else if (typeof AuditLogModel.log === 'function') {
        await AuditLogModel.log({
          userId: req.user?.id || null,
          username: req.user?.name || req.user?.email || 'Office User',
          masterName: 'home_section_master',
          changeType: 'REORDER',
          afterData: { reorderedCount: orderList.length },
          ipAddress: req.ip || req.connection?.remoteAddress,
        });
      }
    } catch (auditErr) {
      console.warn('[homeSectionController] Audit log failed (non-critical):', auditErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Sections reordered successfully',
      sections,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/home-sections
 * @desc    Public endpoint for storefront Home Page to retrieve active sections with fully hydrated products
 * @access  Public
 */
const getPublicHomeSections = async (req, res, next) => {
  try {
    const sections = await HomeSectionModel.findAll({ activeOnly: true });

    // Hydrate each section's product_ids with ProductModel.findByPks
    const hydratedSections = await Promise.all(
      sections.map(async (sec) => {
        let products = [];
        if (Array.isArray(sec.product_ids) && sec.product_ids.length > 0) {
          products = await ProductModel.findByPks(sec.product_ids, { hasImage: true, inStock: true });
        }
        return {
          id: sec.id,
          heading: sec.heading,
          sub_heading: sec.sub_heading,
          display_order: sec.display_order,
          products,
        };
      })
    );

    // Filter out sections that have zero matching active products with images
    const activeWithProducts = hydratedSections.filter((s) => s.products.length > 0);

    res.status(200).json({
      success: true,
      count: activeWithProducts.length,
      sections: activeWithProducts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminSections,
  createSection,
  updateSection,
  toggleSectionActive,
  deleteSection,
  reorderSections,
  getPublicHomeSections,
};

