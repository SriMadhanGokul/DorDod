// backend/utils/cloudinary.js
// Replaces firebase.js — uses Cloudinary free tier (25GB)
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload a buffer to Cloudinary and return secure URL + public_id
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || "uploads",
        resource_type: options.resource_type || "auto",
        public_id: options.public_id || undefined,
        overwrite: true,
        transformation: options.transformation || undefined,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, public_id: result.public_id });
      },
    );
    Readable.from(buffer).pipe(uploadStream);
  });
};

// Delete a file from Cloudinary by public_id
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (err) {
    console.warn("Cloudinary delete warning:", err.message);
  }
};

// Extract public_id from a Cloudinary URL
const getPublicIdFromUrl = (url) => {
  try {
    if (!url || !url.includes("cloudinary.com")) return null;
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;
    // Skip version segment (v1234567) if present
    let startIndex = uploadIndex + 1;
    if (parts[startIndex]?.match(/^v\d+$/)) startIndex++;
    const pathWithExt = parts.slice(startIndex).join("/");
    return pathWithExt.replace(/\.[^/.]+$/, ""); // remove extension
  } catch {
    return null;
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
};
