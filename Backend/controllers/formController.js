const ContactInquiryModel = require('../models/contactInquiryModel');
const NewsletterModel = require('../models/newsletterModel');
const AuditLogModel = require('../models/auditLogModel');

/**
 * Extract client IP address safely from request
 */
const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    null
  );
};

// ─────────────────────────────────────────────────────────────
// Public Storefront Form Controllers
// ─────────────────────────────────────────────────────────────

/**
 * Handle Contact Us Form Submission
 * POST /api/forms/contact or POST /api/contact
 */
const submitContactInquiry = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required.'
      });
    }

    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required.'
      });
    }

    if (!message || message.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a message of at least 5 characters.'
      });
    }

    const ipAddress = getClientIp(req);
    const newInquiry = await ContactInquiryModel.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : null,
      subject: subject && subject.trim() ? subject.trim() : 'General Inquiry',
      message: message.trim(),
      ipAddress
    });

    // Record audit trail
    await AuditLogModel.log({
      userId: null,
      username: `${name.trim()} (${email.trim()})`,
      masterName: 'contact_inquiry',
      changeType: 'SUBMISSION',
      afterData: {
        id: newInquiry.id,
        name: newInquiry.name,
        email: newInquiry.email,
        subject: newInquiry.subject
      },
      ipAddress
    });

    return res.status(201).json({
      success: true,
      message: `Thank you ${name.trim()}. Your message has been received by our Winnipeg team. We will get back to you shortly.`,
      inquiry: newInquiry
    });
  } catch (err) {
    console.error('[FormController] Error submitting contact inquiry:', err);
    next(err);
  }
};

/**
 * Handle Newsletter Subscription Form Submission
 * POST /api/forms/newsletter or POST /api/newsletter
 */
const subscribeNewsletter = async (req, res, next) => {
  try {
    const { email, consent, source } = req.body;

    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (!consent) {
      return res.status(400).json({
        success: false,
        message: 'Age confirmation (19+) and marketing consent are required.'
      });
    }

    const ipAddress = getClientIp(req);
    const cleanEmail = email.trim().toLowerCase();

    const { subscriber, isNew } = await NewsletterModel.subscribe({
      email: cleanEmail,
      consent: true,
      source: source || 'homepage_circle',
      ipAddress
    });

    // Record audit trail
    await AuditLogModel.log({
      userId: null,
      username: cleanEmail,
      masterName: 'newsletter_subscription',
      changeType: isNew ? 'SUBSCRIBE' : 'RESUBSCRIBE',
      afterData: { id: subscriber.id, email: subscriber.email, source: subscriber.source },
      ipAddress
    });

    return res.status(200).json({
      success: true,
      isNew,
      message: isNew
        ? 'Welcome to Pharsyde Circle! Check your inbox for your 10% welcome invitation.'
        : 'Welcome back! Your subscription to Pharsyde Circle is active.',
      subscriber
    });
  } catch (err) {
    console.error('[FormController] Error subscribing newsletter:', err);
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// Admin Office Management Controllers
// ─────────────────────────────────────────────────────────────

/**
 * Get all contact inquiries with pagination and filters
 * GET /api/office/contact-inquiries
 */
const getOfficeContactInquiries = async (req, res, next) => {
  try {
    const { search = '', status = 'all', page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    const [result, stats] = await Promise.all([
      ContactInquiryModel.findAll({ search, status, page, limit, sortBy, sortOrder }),
      ContactInquiryModel.getStats()
    ]);

    return res.status(200).json({
      success: true,
      ...result,
      stats
    });
  } catch (err) {
    console.error('[FormController] Error fetching office contact inquiries:', err);
    next(err);
  }
};

/**
 * Get single contact inquiry by ID
 * GET /api/office/contact-inquiries/:id
 */
const getOfficeContactInquiryById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const inquiry = await ContactInquiryModel.findById(id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Contact inquiry not found.'
      });
    }

    return res.status(200).json({
      success: true,
      inquiry
    });
  } catch (err) {
    console.error('[FormController] Error fetching inquiry by ID:', err);
    next(err);
  }
};

/**
 * Update contact inquiry status or admin notes
 * PATCH /api/office/contact-inquiries/:id/status
 */
const updateOfficeContactInquiryStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status, adminNotes } = req.body;

    const existing = await ContactInquiryModel.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Contact inquiry not found.'
      });
    }

    await ContactInquiryModel.updateStatus(id, { status, adminNotes });
    const updated = await ContactInquiryModel.findById(id);

    await AuditLogModel.log({
      userId: req.user?.id || null,
      username: req.user?.username || req.user?.name || 'admin',
      masterName: 'contact_inquiry',
      changeType: 'UPDATED',
      beforeData: { status: existing.status, adminNotes: existing.admin_notes },
      afterData: { status: updated.status, adminNotes: updated.admin_notes },
      ipAddress: getClientIp(req)
    });

    return res.status(200).json({
      success: true,
      message: 'Contact inquiry updated successfully.',
      inquiry: updated
    });
  } catch (err) {
    console.error('[FormController] Error updating inquiry status:', err);
    next(err);
  }
};

/**
 * Delete a contact inquiry
 * DELETE /api/office/contact-inquiries/:id
 */
const deleteOfficeContactInquiry = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await ContactInquiryModel.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Contact inquiry not found.'
      });
    }

    await ContactInquiryModel.delete(id);

    await AuditLogModel.log({
      userId: req.user?.id || null,
      username: req.user?.username || req.user?.name || 'admin',
      masterName: 'contact_inquiry',
      changeType: 'DELETED',
      beforeData: existing,
      ipAddress: getClientIp(req)
    });

    return res.status(200).json({
      success: true,
      message: 'Contact inquiry deleted successfully.'
    });
  } catch (err) {
    console.error('[FormController] Error deleting contact inquiry:', err);
    next(err);
  }
};

/**
 * Get all newsletter subscriptions with pagination and filters
 * GET /api/office/newsletter-subscriptions
 */
const getOfficeNewsletterSubscribers = async (req, res, next) => {
  try {
    const { search = '', status = 'all', page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    const [result, stats] = await Promise.all([
      NewsletterModel.findAll({ search, status, page, limit, sortBy, sortOrder }),
      NewsletterModel.getStats()
    ]);

    return res.status(200).json({
      success: true,
      ...result,
      stats
    });
  } catch (err) {
    console.error('[FormController] Error fetching newsletter subscriptions:', err);
    next(err);
  }
};

/**
 * Update newsletter subscriber status ('subscribed' or 'unsubscribed')
 * PATCH /api/office/newsletter-subscriptions/:id/status
 */
const updateOfficeNewsletterStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!status || !['subscribed', 'unsubscribed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "subscribed" or "unsubscribed".'
      });
    }

    const existing = await NewsletterModel.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found.'
      });
    }

    await NewsletterModel.updateStatus(id, status);
    const updated = await NewsletterModel.findById(id);

    await AuditLogModel.log({
      userId: req.user?.id || null,
      username: req.user?.username || req.user?.name || 'admin',
      masterName: 'newsletter_subscription',
      changeType: status === 'subscribed' ? 'ACTIVATED' : 'DEACTIVATED',
      beforeData: { status: existing.status },
      afterData: { status: updated.status },
      ipAddress: getClientIp(req)
    });

    return res.status(200).json({
      success: true,
      message: `Subscriber marked as ${status}.`,
      subscriber: updated
    });
  } catch (err) {
    console.error('[FormController] Error updating newsletter status:', err);
    next(err);
  }
};

/**
 * Delete a newsletter subscriber
 * DELETE /api/office/newsletter-subscriptions/:id
 */
const deleteOfficeNewsletterSubscriber = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await NewsletterModel.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found.'
      });
    }

    await NewsletterModel.delete(id);

    await AuditLogModel.log({
      userId: req.user?.id || null,
      username: req.user?.username || req.user?.name || 'admin',
      masterName: 'newsletter_subscription',
      changeType: 'DELETED',
      beforeData: existing,
      ipAddress: getClientIp(req)
    });

    return res.status(200).json({
      success: true,
      message: 'Subscriber removed successfully.'
    });
  } catch (err) {
    console.error('[FormController] Error deleting newsletter subscriber:', err);
    next(err);
  }
};

module.exports = {
  submitContactInquiry,
  subscribeNewsletter,
  getOfficeContactInquiries,
  getOfficeContactInquiryById,
  updateOfficeContactInquiryStatus,
  deleteOfficeContactInquiry,
  getOfficeNewsletterSubscribers,
  updateOfficeNewsletterStatus,
  deleteOfficeNewsletterSubscriber
};

