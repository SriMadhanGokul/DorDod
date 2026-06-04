const Document = require('../models/Document');
const { uploadToFirebase, deleteFromFirebase } = require('../utils/firebase');

const CATEGORIES = ['Resume','Portfolio','Educational','Cover Letter','Professional','Personal/KYC','Bank','Accomplishment','Other'];

const getDocuments = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { user: req.user.id };
    if (category && category !== 'All') filter.category = category;
    const docs = await Document.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
};

const createDocument = async (req, res) => {
  try {
    const { name, category, fileUrl, notes } = req.body;
    if (!name?.trim())   return res.status(400).json({ success: false, message: 'Document name is required' });
    if (!category)       return res.status(400).json({ success: false, message: 'Please select a category' });
    if (!CATEGORIES.includes(category)) return res.status(400).json({ success: false, message: 'Invalid category' });
    if (!req.file && !fileUrl?.trim())
      return res.status(400).json({ success: false, message: 'Please upload a file or provide a URL' });

    let finalUrl = fileUrl || '';
    let fileName = '';
    let fileSize = 0;
    let mimeType = '';

    if (req.file) {
      // Upload to Firebase Storage
      const { url } = await uploadToFirebase(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        `documents/${req.user.id}`
      );
      finalUrl = url;
      fileName = req.file.originalname;
      fileSize = req.file.size;
      mimeType = req.file.mimetype;
    }

    const doc = await Document.create({
      user: req.user.id, name: name.trim(), category,
      notes: notes || '', fileUrl: finalUrl,
      fileName, fileSize, mimeType,
    });
    res.status(201).json({ success: true, message: 'Document added!', data: doc });
  } catch (err) {
    console.error('createDocument:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to add document' });
  }
};

const updateDocument = async (req, res) => {
  try {
    const { name, category, notes } = req.body;
    if (!name?.trim())   return res.status(400).json({ success: false, message: 'Document name is required' });
    if (!category)       return res.status(400).json({ success: false, message: 'Please select a category' });
    const doc = await Document.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { name: name.trim(), category, notes: notes || '' },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    res.status(200).json({ success: true, message: 'Document updated!', data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update document' });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    // Delete from Firebase if it was uploaded
    if (doc.fileUrl && doc.fileUrl.includes('storage.googleapis.com')) {
      await deleteFromFirebase(doc.fileUrl).catch(() => {});
    }
    res.status(200).json({ success: true, message: 'Document deleted!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
};

module.exports = { getDocuments, createDocument, updateDocument, deleteDocument };