
import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminAuthInstance: Auth | null = null;
let adminDbInstance: Firestore | null = null;

if (!admin.apps.length) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const projectId = process.env.FIREBASE_SERVICE_ACCOUNT_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL;
  // Ensure private key newlines are correctly interpreted
  const privateKey = (process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  let initialized = false;
  let initializationError: any = null;

  console.log("Attempting Firebase Admin SDK initialization...");

  // Attempt 1: Using GOOGLE_APPLICATION_CREDENTIALS environment variable (path to JSON file)
  if (serviceAccountPath) {
    try {
      console.log(`Attempting initialization with GOOGLE_APPLICATION_CREDENTIALS: ${serviceAccountPath}`);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccountPath) });
      console.log("Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS path.");
      initialized = true;
    } catch (error: any) {
      console.warn("Warning: Failed to initialize with GOOGLE_APPLICATION_CREDENTIALS path:", error.message);
      initializationError = error;
    }
  } else {
    console.log("GOOGLE_APPLICATION_CREDENTIALS environment variable not set.");
  }

  // Attempt 2: Using explicit service account components from environment variables
  if (!initialized && projectId && clientEmail && privateKey && privateKey.length > 10) {
    try {
      console.log("Attempting initialization with explicit service account components...");
      console.log(`Project ID: ${projectId ? 'Found' : 'Missing'}`);
      console.log(`Client Email: ${clientEmail ? 'Found' : 'Missing'}`);
      console.log(`Private Key: ${privateKey && privateKey.length > 10 ? 'Found' : 'Missing or too short'}`);
      admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
      console.log("Firebase Admin SDK initialized with explicit service account components.");
      initialized = true;
    } catch (error: any) {
      console.warn("Warning: Failed to initialize with explicit service account components:", error.message);
      initializationError = error;
    }
  } else if (!initialized) {
    console.log("One or more explicit Firebase Admin SDK environment variables (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY) are missing or invalid for Attempt 2.");
  }

  // Attempt 3: Using Application Default Credentials (suitable for GCP environments like Cloud Run, App Engine)
  // Check if running in a known GCP environment (this is a heuristic)
  if (!initialized && process.env.NODE_ENV === 'production' && (process.env.K_SERVICE || process.env.GAE_SERVICE || process.env.FUNCTION_TARGET || process.env.FUNCTIONS_EMULATOR)) {
    try {
      console.log("Attempting initialization with Application Default Credentials (suitable for GCP or emulators)...");
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
      console.log("Firebase Admin SDK initialized with Application Default Credentials.");
      initialized = true;
    } catch (error: any) {
      console.warn("Warning: Failed to initialize with Application Default Credentials:", error.message);
      initializationError = error;
    }
  } else if (!initialized) {
    console.log("Not attempting Application Default Credentials or not in a recognized GCP/emulator production environment.");
  }
  
  if (admin.apps.length > 0) {
    adminApp = admin.app();
    adminAuthInstance = admin.auth(adminApp);
    adminDbInstance = admin.firestore(adminApp);
    console.log("Firebase Admin SDK successfully configured and instances assigned.");
  } else {
    const errorMessage = `CRITICAL: Firebase Admin SDK failed to initialize after all attempts. Ensure service account credentials are correctly configured in your environment variables (.env.local for development, or environment configuration for production). Server-side Firebase operations will fail. Last error: ${initializationError?.message || 'Unknown error during initialization attempts.'}`;
    console.error(errorMessage);
    throw new Error(errorMessage); // This error will stop the module from loading incorrectly.
  }
} else {
  // SDK already initialized
  adminApp = admin.app(); // Use the already initialized default app
  adminAuthInstance = admin.auth(adminApp);
  adminDbInstance = admin.firestore(adminApp);
  console.log("Firebase Admin SDK was already initialized. Reusing existing instances.");
}

// Export non-null instances; the throw above ensures they are set if module loads.
export { adminApp as admin, adminAuthInstance as adminAuth, adminDbInstance as adminDb };
