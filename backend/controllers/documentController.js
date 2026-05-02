const Document = require("../models/Document");
const path = require("path");
const fs = require("fs");

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
    const { name, category, fileUrl, notes } = req.body;
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
    if (!req.file && !fileUrl?.trim())
      return res
        .status(400)
        .json({
          success: false,
          message: "Please upload a file or provide a file URL",
        });

    const doc = await Document.create({
      user: req.user.id,
      name: name.trim(),
      category,
      notes: notes || "",
      fileUrl: fileUrl || "",
      filePath: req.file ? `/uploads/documents/${req.file.filename}` : "",
      fileName: req.file ? req.file.originalname : "",
      fileSize: req.file ? req.file.size : 0,
      mimeType: req.file ? req.file.mimetype : "",
    });
    res
      .status(201)
      .json({ success: true, message: "Document added!", data: doc });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: err.message || "Failed to add document",
      });
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
    if (doc.filePath) {
      const fullPath = path.join(__dirname, "..", doc.filePath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }
    res.status(200).json({ success: true, message: "Document deleted!" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete document" });
  }
};

module.exports = { getDocuments, createDocument, deleteDocument };
