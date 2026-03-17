const AuditLog = require('../models/AuditLog');

/**
 * Logs a system action to the AuditLog collection
 */
const logAction = async (req, action, entityType, entityId, details = {}) => {
  try {
    await AuditLog.create({
      userId: req.user.id,
      action,
      entityType,
      entityId,
      details,
      ipAddress: req.ip || req.connection.remoteAddress
    });
  } catch (error) {
    console.error('Audit Logging Failed:', error);
  }
};

module.exports = logAction;
