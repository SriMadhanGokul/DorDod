const express  = require('express');
const router   = express.Router();
const protect  = require('../utils/protect');
const { uploadDocument } = require('../utils/uploadMiddleware');
const { getDocuments, createDocument, updateDocument, deleteDocument } = require('../controllers/documentController');

router.use(protect);
router.get('/',       getDocuments);
router.post('/',      uploadDocument.single('file'), createDocument);
router.put('/:id',    updateDocument);
router.delete('/:id', deleteDocument);

module.exports = router;