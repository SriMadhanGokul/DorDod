const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:     { type: String, required: [true, 'Document name is required'], trim: true },
  category: {
    type: String,
    enum: ['Resume','Portfolio','Educational','Cover Letter','Professional','Personal/KYC','Bank','Accomplishment','Other'],
    required: [true, 'Category is required'],
  },
  fileUrl:    { type: String, default: '' },   // external URL
  filePath:   { type: String, default: '' },   // uploaded file server path
  fileName:   { type: String, default: '' },   // original file name
  fileSize:   { type: Number, default: 0 },    // bytes
  mimeType:   { type: String, default: '' },
  notes:      { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);