const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");
const { v4: uuidv4 } = require("uuid");

class StorageService {
  /**
   * Generates a signed upload URL or Cloudinary direct parameters
   */
  static generatePresignedUpload(organizationId, filename, mimeType) {
    const s3ObjectKey = `gov-infra/${organizationId}/${uuidv4()}-${filename}`;
    
    // In production with Cloudinary credentials
    if (isCloudinaryConfigured()) {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder: `gov-infra/${organizationId}` },
        process.env.CLOUDINARY_API_SECRET
      );
      const uploadUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`;
      return { uploadUrl, s3ObjectKey, signature, timestamp };
    }

    // Direct endpoint fallback for development/testing
    const uploadUrl = `/api/v1/documents/direct-upload?key=${encodeURIComponent(s3ObjectKey)}`;
    return { uploadUrl, s3ObjectKey };
  }

  /**
   * Generate download URL for Cloudinary or direct static access
   */
  static generateDownloadUrl(s3ObjectKey) {
    if (isCloudinaryConfigured() && !s3ObjectKey.startsWith("http")) {
      return cloudinary.url(s3ObjectKey, { secure: true });
    }
    if (s3ObjectKey.startsWith("http")) {
      return s3ObjectKey;
    }
    return `/api/v1/documents/file?key=${encodeURIComponent(s3ObjectKey)}`;
  }
}

module.exports = StorageService;
