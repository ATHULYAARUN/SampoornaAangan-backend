const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let firebaseApp = null;

const initializeFirebase = () => {
  try {
    if (!firebaseApp) {
      let serviceAccount = null;

      // Method 1: Try to load from service account key file
      const serviceAccountPath = path.join(__dirname, 'keys', 'serviceAccountKey.json');
      if (fs.existsSync(serviceAccountPath)) {
        console.log('📁 Loading Firebase config from service account file...');
        serviceAccount = require(serviceAccountPath);
      } 
      // Method 2: Try to load from environment variables
      else if (process.env.FIREBASE_PROJECT_ID && 
               process.env.FIREBASE_PRIVATE_KEY && 
               process.env.FIREBASE_CLIENT_EMAIL) {
        console.log('🔧 Loading Firebase config from environment variables...');
        serviceAccount = {
          type: "service_account",
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
          token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        };
      } else {
        console.warn('⚠️ Firebase credentials not found!');
        console.warn('Please either:');
        console.warn('1. Place your serviceAccountKey.json in backend/config/keys/');
        console.warn('2. Or configure Firebase environment variables in .env file');
        console.warn('Server will continue with limited functionality.');
        return null;
      }

      // Initialize Firebase Admin SDK
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });

      console.log('✅ Firebase Admin SDK initialized successfully');
      console.log(`🔥 Project ID: ${serviceAccount.project_id}`);
    }
    return firebaseApp;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.warn('⚠️ Server will continue without Firebase. Some features may not work.');
    return null;
  }
};

const getFirebaseAuth = () => {
  if (!firebaseApp) {
    throw new Error('Firebase not initialized. Please configure Firebase credentials.');
  }
  return admin.auth();
};

const verifyFirebaseToken = async (idToken) => {
  try {
    if (!firebaseApp) {
      throw new Error('Firebase not configured. Please set up Firebase credentials.');
    }
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Firebase token verification error:', error);
    throw new Error('Invalid Firebase token');
  }
};

const createFirebaseUser = async (userData) => {
  try {
    const auth = getFirebaseAuth();
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.name,
      disabled: false,
    });
    
    // Set custom claims for role-based access
    await auth.setCustomUserClaims(userRecord.uid, {
      role: userData.role,
      userType: userData.role,
    });

    return userRecord;
  } catch (error) {
    console.error('Firebase user creation error:', error);
    throw error;
  }
};

const updateFirebaseUser = async (uid, updateData) => {
  try {
    const auth = getFirebaseAuth();
    const userRecord = await auth.updateUser(uid, updateData);
    return userRecord;
  } catch (error) {
    console.error('Firebase user update error:', error);
    throw error;
  }
};

const deleteFirebaseUser = async (uid) => {
  try {
    const auth = getFirebaseAuth();
    await auth.deleteUser(uid);
    return true;
  } catch (error) {
    console.error('Firebase user deletion error:', error);
    throw error;
  }
};

const setCustomClaims = async (uid, claims) => {
  try {
    const auth = getFirebaseAuth();
    await auth.setCustomUserClaims(uid, claims);
    return true;
  } catch (error) {
    console.error('Firebase custom claims error:', error);
    throw error;
  }
};

const getFirebaseUser = async (uid) => {
  try {
    const auth = getFirebaseAuth();
    const userRecord = await auth.getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Firebase get user error:', error);
    throw error;
  }
};

module.exports = {
  initializeFirebase,
  getFirebaseAuth,
  verifyFirebaseToken,
  createFirebaseUser,
  updateFirebaseUser,
  deleteFirebaseUser,
  setCustomClaims,
  getFirebaseUser,
};