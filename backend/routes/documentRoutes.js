const express = require('express');
const router = express.Router();
const { getDocuments, createDocument, deleteDocument } = require('../controllers/documentController');
const protect = require('../utils/protect');
router.use(protect);
router.route('/').get(getDocuments).post(createDocument);
router.delete('/:id', deleteDocument);
module.exports = router;