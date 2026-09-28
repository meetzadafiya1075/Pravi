const Asset = require("../models/Asset");
const InfrastructureInspection = require("../models/InfrastructureInspection");
const { MaintenanceTicket } = require("../models/MaintenanceTicket");
const InfrastructureProject = require("../models/InfrastructureProject");
const AuditLog = require("../models/AuditLog");
const { stringify } = require("csv-stringify");

exports.exportAssetRegister = async (req, res, next) => {
  try {
    const orgId = req.user.organization_id;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="Government_Asset_Register.csv"');

    const stringifier = stringify({
      header: true,
      columns: [
        "asset_tag",
        "name",
        "district",
        "zone",
        "ward",
        "condition",
        "criticality",
        "status",
        "purchase_cost",
        "current_book_value",
        "funding_source",
        "funding_scheme",
        "createdAt",
      ],
    });

    stringifier.pipe(res);

    const cursor = Asset.find({ organization_id: orgId, is_deleted: false }).cursor();
    for await (const doc of cursor) {
      stringifier.write({
        asset_tag: doc.asset_tag,
        name: doc.name,
        district: doc.district || "",
        zone: doc.zone || "",
        ward: doc.ward || "",
        condition: doc.condition,
        criticality: doc.criticality,
        status: doc.status,
        purchase_cost: doc.purchase_cost,
        current_book_value: doc.current_book_value,
        funding_source: doc.funding_source || "",
        funding_scheme: doc.funding_scheme || "",
        createdAt: doc.createdAt ? doc.createdAt.toISOString() : "",
      });
    }

    stringifier.end();
  } catch (err) {
    next(err);
  }
};

exports.exportAuditLogs = async (req, res, next) => {
  try {
    const orgId = req.user.organization_id;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="Statutory_Audit_Trail.csv"');

    const stringifier = stringify({
      header: true,
      columns: ["timestamp", "action", "entity_type", "entity_id", "actor_id", "ip_address"],
    });

    stringifier.pipe(res);

    const cursor = AuditLog.find({ organization_id: orgId }).sort({ timestamp: -1 }).limit(1000).cursor();
    for await (const doc of cursor) {
      stringifier.write({
        timestamp: doc.timestamp ? doc.timestamp.toISOString() : "",
        action: doc.action,
        entity_type: doc.entity_type,
        entity_id: doc.entity_id,
        actor_id: doc.actor_id || "",
        ip_address: doc.ip_address || "",
      });
    }

    stringifier.end();
  } catch (err) {
    next(err);
  }
};
