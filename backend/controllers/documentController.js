const Document = require("../models/Document");

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

// GET /api/documents
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

// POST /api/documents
const createDocument = async (req, res) => {
  try {
    const { name, category, fileUrl, notes } = req.body;
    if (!name?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Document name is required" });
    if (!CATEGORIES.includes(category))
      return res
        .status(400)
        .json({ success: false, message: "Invalid category" });
    const doc = await Document.create({
      user: req.user.id,
      name,
      category,
      fileUrl,
      notes,
    });
    res
      .status(201)
      .json({ success: true, message: "Document added!", data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to add document" });
  }
};

// DELETE /api/documents/:id
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
    res.status(200).json({ success: true, message: "Document deleted!" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete document" });
  }
};

module.exports = { getDocuments, createDocument, deleteDocument };
