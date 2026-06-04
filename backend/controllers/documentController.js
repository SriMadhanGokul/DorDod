// backend/controllers/documentController.js
const Document = require("../models/Document");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
} = require("../utils/cloudinary");

const CATEGORIES = [
  "Resume",
  "Portfolio",
  "Educational",
  "Cover Letter",
  "Professional",
  "Personal/KYC",
  "Bank",
  "Accomplishment",
  "Other",
];

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const getDocuments = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { user: req.user.id };
    if (category && category !== "All") filter.category = category;
    const docs = await Document.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: docs });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch documents" });
  }
};

const createDocument = async (req, res) => {
  try {
    const { name, category, notes } = req.body;

    if (!name?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Document name is required" });
    if (!category)
      return res
        .status(400)
        .json({ success: false, message: "Please select a category" });
    if (!CATEGORIES.includes(category))
      return res
        .status(400)
        .json({ success: false, message: "Invalid category" });
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "Please upload a file" });

    // Enforce 2MB size limit
    if (req.file.size > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`,
      });
    }

    // Determine resource type for Cloudinary
    const isPDF = req.file.mimetype === "application/pdf";
    const resourceType = isPDF ? "raw" : "image";

    // Upload to Cloudinary
    const { url, public_id } = await uploadToCloudinary(req.file.buffer, {
      folder: `documents/${req.user.id}`,
      resource_type: resourceType,
    });

    const doc = await Document.create({
      user: req.user.id,
      name: name.trim(),
      category,
      notes: notes || "",
      fileUrl: url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      cloudinaryPublicId: public_id, // store for deletion
    });

    res
      .status(201)
      .json({ success: true, message: "Document uploaded!", data: doc });
  } catch (err) {
    console.error("createDocument error:", err);
    res
      .status(500)
      .json({
        success: false,
        message: err.message || "Failed to upload document",
      });
  }
};

const updateDocument = async (req, res) => {
  try {
    const { name, category, notes } = req.body;
    if (!name?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Document name is required" });
    if (!category)
      return res
        .status(400)
        .json({ success: false, message: "Please select a category" });

    const doc = await Document.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { name: name.trim(), category, notes: notes || "" },
      { new: true },
    );
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    res
      .status(200)
      .json({ success: true, message: "Document updated!", data: doc });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update document" });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });

    // Delete from Cloudinary
    if (doc.cloudinaryPublicId) {
      const resourceType = doc.mimeType === "application/pdf" ? "raw" : "image";
      await deleteFromCloudinary(doc.cloudinaryPublicId, resourceType);
    } else if (doc.fileUrl && doc.fileUrl.includes("cloudinary.com")) {
      // Fallback: extract public_id from URL
      const publicId = getPublicIdFromUrl(doc.fileUrl);
      if (publicId) {
        const resourceType =
          doc.mimeType === "application/pdf" ? "raw" : "image";
        await deleteFromCloudinary(publicId, resourceType);
      }
    }

    res.status(200).json({ success: true, message: "Document deleted!" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete document" });
  }
};

module.exports = {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
};
