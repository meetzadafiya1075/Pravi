const AuditLog = require("../models/AuditLog");

class AuditService {
  static async logAction({
    organizationId,
    actorId,
    action,
    entityType,
    entityId,
    beforeState = null,
    afterState = null,
    ipAddress = null,
    userAgent = null,
  }) {
    try {
      const log = new AuditLog({
        organization_id: organizationId,
        actor_id: actorId,
        action,
        entity_type: entityType,
        entity_id: String(entityId),
        before_state: beforeState,
        after_state: afterState,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
      await log.save();
      return log;
    } catch (err) {
      console.error("[AuditService] Failed to record audit log:", err.message);
      return null;
    }
  }
}

module.exports = AuditService;
