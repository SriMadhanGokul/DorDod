// backend/utils/firebase.js
// ── Firebase Admin SDK setup for server-side uploads ──────────────────────────
const admin = require('firebase-admin');

let bucket;

const initFirebase = () => {
  if (admin.apps.length > 0) {
    bucket = admin.storage().bucket();
    return;
  }

  const serviceAccount = {
    type:                        'service_account',
    project_id:                  process.env.FIREBASE_PROJECT_ID,
    private_key_id:              process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key:                 process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email:                process.env.FIREBASE_CLIENT_EMAIL,
    client_id:                   process.env.FIREBASE_CLIENT_ID,
    auth_uri:                    'https://accounts.google.com/o/oauth2/auth',
    token_uri:                   'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url:        process.env.FIREBASE_CLIENT_CERT_URL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  bucket = admin.storage().bucket();
  console.log('✅ Firebase Admin initialized');
};

// Upload buffer/stream to Firebase Storage and return public URL
const uploadToFirebase = async (fileBuffer, fileName, mimeType, folder = 'uploads') => {
  if (!bucket) initFirebase();

  const timestamp  = Date.now();
  const safeName   = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath   = `${folder}/${timestamp}_${safeName}`;
  const fileRef    = bucket.file(filePath);

  await fileRef.save(fileBuffer, {
    metadata: { contentType: mimeType },
    public: true,
  });

  // Return public download URL
  const publicUrl = `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/${filePath}`;
  return { url: publicUrl, filePath };
};

// Delete file from Firebase Storage
const deleteFromFirebase = async (filePath) => {
  if (!bucket) initFirebase();
  try {
    if (filePath && filePath.includes('storage.googleapis.com')) {
      // Extract path from full URL
      const bucket_name = process.env.FIREBASE_STORAGE_BUCKET;
      const path = filePath.split(`${bucket_name}/`)[1];
      if (path) await bucket.file(path).delete();
    }
  } catch (err) {
    console.warn('Firebase delete warning:', err.message);
  }
};

module.exports = { initFirebase, uploadToFirebase, deleteFromFirebase };