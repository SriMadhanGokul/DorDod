// backend/utils/firebase.js
// Firebase replaced by Cloudinary. This stub keeps server.js working
// without requiring any changes to the import/initFirebase() call there.

const initFirebase = () => {
  console.log("ℹ️  Firebase disabled — using Cloudinary for file storage");
};

// These are kept as stubs in case any old code still imports them
const uploadToFirebase = async () => {
  throw new Error("Firebase disabled. Use Cloudinary.");
};
const deleteFromFirebase = async () => {};

module.exports = { initFirebase, uploadToFirebase, deleteFromFirebase };
