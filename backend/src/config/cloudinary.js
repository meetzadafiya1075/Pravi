const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo-gov-infra",
  api_key: process.env.CLOUDINARY_API_KEY || "123456789",
  api_secret: process.env.CLOUDINARY_API_SECRET || "mock-secret-key",
  secure: true,
});

const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
};
