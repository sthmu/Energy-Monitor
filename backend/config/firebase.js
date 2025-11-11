const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const initializeFirebase = () => {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      return admin.firestore();
    }

    // Use environment variables for production (VM deployment)
    // Or JSON file for local development
    let serviceAccount;
    
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      // Production: Use environment variables from .env file
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };
      console.log('🔐 Using Firebase credentials from environment variables');
    } else {
      // Development: Use JSON file
      const serviceAccountPath = path.join(__dirname, '../energy-monitoring-system-s-firebase-adminsdk-fbsvc-b0319ab8b8.json');
      serviceAccount = require(serviceAccountPath);
      console.log('📁 Using Firebase credentials from JSON file');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('✅ Firebase initialized successfully');
    console.log('📊 Project ID:', serviceAccount.projectId || serviceAccount.project_id);
    return admin.firestore();
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    throw error;
  }
};

// Get Firestore instance
const db = initializeFirebase();

module.exports = { db, admin };