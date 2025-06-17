
import * as admin from 'firebase-admin';

let adminApp: admin.app.App;
let adminAuthInstance: admin.auth.Auth;
let adminDbInstance: admin.firestore.Firestore;

if (!admin.apps.length) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const projectId = process.env.FIREBASE_SERVICE_ACCOUNT_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  let initialized = false;

  if (serviceAccountPath) {
    try {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccountPath) });
      console.log("Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS path.");
      initialized = true;
    } catch (error: any) {
      console.warn("Warning: Failed to initialize Firebase Admin with GOOGLE_APPLICATION_CREDENTIALS path:", error.message);
    }
  }

  if (!initialized && projectId && clientEmail && privateKey && privateKey.length > 10) {
    try {
      admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
      console.log("Firebase Admin SDK initialized with explicit service account components.");
      initialized = true;
    } catch (error: any) {
      console.warn("Warning: Failed to initialize Firebase Admin with explicit components:", error.message);
    }
  }

  if (!initialized && process.env.NODE_ENV === 'production' && !process.env.VERCEL && process.env.K_SERVICE) {
    try {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
      console.log("Firebase Admin SDK initialized with Application Default Credentials (likely in Google Cloud environment).");
      initialized = true;
    } catch (error: any) {
      console.warn("Warning: Failed to initialize with Application Default Credentials:", error.message);
    }
  }

  if (!admin.apps.length) { // Check again after all attempts
    const errorMessage = "CRITICAL: Firebase Admin SDK failed to initialize after all attempts. Ensure service account credentials are correctly configured in your environment variables (.env.local for development, or environment configuration for production). Server-side Firebase operations will fail.";
    console.error(errorMessage);
    throw new Error(errorMessage); // Throw an error if initialization failed
  }
}

// If we reach here, admin.apps.length > 0, so admin is initialized.
adminApp = admin.app(); // Get the default app instance
adminAuthInstance = admin.auth(adminApp);
adminDbInstance = admin.firestore(adminApp);

// Ensure instances are not undefined/null before exporting (should be guaranteed by throw above)
if (!adminApp || !adminAuthInstance || !adminDbInstance) {
    const criticalError = "Firebase Admin SDK instances are unexpectedly null/undefined after successful initialization check. This indicates a critical issue in the initialization logic.";
    console.error(criticalError);
    throw new Error(criticalError);
}

export { adminApp as admin, adminAuthInstance as adminAuth, adminDbInstance as adminDb };
