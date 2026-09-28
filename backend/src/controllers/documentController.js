const Document = require("../models/Document");
const StorageService = require("../services/storageService");

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

exports.presignUpload = async (req, res, next) => {
  try {
    const { file_name, file_size_bytes, mime_type } = req.body;

    if (!ALLOWED_MIME_TYPES.has(mime_type)) {
      return res.status(400).json({
        detail: `MIME type '${mime_type}' is not allowed. Allowed types: ${Array.from(ALLOWED_MIME_TYPES).join(", ")}`,
      });
    }

    if (file_size_bytes > MAX_FILE_SIZE) {
      return res.status(400).json({ detail: "File size exceeds maximum allowable limit of 15 MB." });
    }

    const presigned = StorageService.generatePresignedUpload(
      req.user.organization_id,
      file_name,
      mime_type
    );

    res.json({
      upload_url: presigned.uploadUrl,
      s3_object_key: presigned.s3ObjectKey,
      signature: presigned.signature,
      timestamp: presigned.timestamp,
    });
  } catch (err) {
    next(err);
  }
};

exports.confirmDocument = async (req, res, next) => {
  try {
    const { asset_id, maintenance_ticket_id, file_name, file_size_bytes, mime_type, s3_object_key, url, public_id } = req.body;

    const doc = await Document.create({
      organization_id: req.user.organization_id,
      asset_id: asset_id || null,
      maintenance_ticket_id: maintenance_ticket_id || null,
      file_name,
      file_size_bytes,
      mime_type,
      s3_object_key,
      url: url || StorageService.generateDownloadUrl(s3_object_key),
      public_id: public_id || s3_object_key,
      uploaded_by_user_id: req.user.id || req.user._id,
    });

    res.status(201).json({
      id: doc.id || doc._id,
      organization_id: doc.organization_id,
      asset_id: doc.asset_id,
      maintenance_ticket_id: doc.maintenance_ticket_id,
      file_name: doc.file_name,
      file_size_bytes: doc.file_size_bytes,
      mime_type: doc.mime_type,
      s3_object_key: doc.s3_object_key,
      download_url: doc.url,
      uploaded_by_user_id: doc.uploaded_by_user_id,
      created_at: doc.created_at,
    });
  } catch (err) {
    next(err);
  }
};

exports.listDocuments = async (req, res, next) => {
  try {
    const { asset_id, ticket_id } = req.query;
    const query = { organization_id: req.user.organization_id };
    if (asset_id) query.asset_id = asset_id;
    if (ticket_id) query.maintenance_ticket_id = ticket_id;

    const docs = await Document.find(query).sort({ created_at: -1 });
    const formatted = docs.map((d) => ({
      id: d.id || d._id,
      organization_id: d.organization_id,
      asset_id: d.asset_id,
      maintenance_ticket_id: d.maintenance_ticket_id,
      file_name: d.file_name,
      file_size_bytes: d.file_size_bytes,
      mime_type: d.mime_type,
      s3_object_key: d.s3_object_key,
      download_url: d.url || StorageService.generateDownloadUrl(d.s3_object_key),
      uploaded_by_user_id: d.uploaded_by_user_id,
      created_at: d.created_at,
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
};
