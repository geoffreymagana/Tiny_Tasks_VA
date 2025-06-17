
import * as admin from 'firebase-admin';

// Ensure environment variables are correctly loaded
// For local development, you'd typically set GOOGLE_APPLICATION_CREDENTIALS
// or provide the individual components via .env.local.
// For Firebase App Hosting, Application Default Credentials should work automatically
// if the associated service account has the correct permissions.

if (!admin.apps.length) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const projectId = process.env.FIREBASE_SERVICE_ACCOUNT_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (serviceAccountPath) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
      });
      console.log("Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS path.");
    } catch (error:any) {
        console.error("Error initializing Firebase Admin with GOOGLE_APPLICATION_CREDENTIALS path:", error.message);
        // Fallback or attempt other methods if needed
        if (projectId && clientEmail && privateKey && privateKey.length > 10) { // privateKey length check is a basic sanity check
            try {
                admin.initializeApp({
                    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
                });
                 console.log("Firebase Admin SDK initialized with explicit service account components as fallback.");
            } catch (fallbackError:any) {
                console.error("Error initializing Firebase Admin with explicit components as fallback:", fallbackError.message);
                // Potentially throw or log more critically if this also fails
            }
        }
    }
  } else if (projectId && clientEmail && privateKey && privateKey.length > 10) {
    try {
        admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        });
        console.log("Firebase Admin SDK initialized with explicit service account components.");
    } catch(error:any) {
        console.error("Error initializing Firebase Admin with explicit components:", error.message);
    }
  } else if (process.env.NODE_ENV === 'production' && !process.env.VERCEL && process.env.K_SERVICE) {
    // Attempt to initialize with Application Default Credentials if running in a Google Cloud environment (like Cloud Run, App Engine, used by Firebase App Hosting)
    // This often doesn't require explicit credential env vars IF the runtime service account has permissions.
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
        });
        console.log("Firebase Admin SDK initialized with Application Default Credentials (likely in Google Cloud environment).");
    } catch (error:any) {
        console.error("Failed to initialize with Application Default Credentials. Ensure service account has permissions or provide explicit credentials for local dev:", error.message);
    }
  }
  else {
    console.warn(
      'Firebase Admin SDK: Credentials not found or incomplete. ',
      'For local development, set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_... variables in .env.local. ',
      'For deployed environments, ensure Application Default Credentials are available and configured.'
    );
    // Depending on strictness, you might throw an error here if admin features are critical
    // throw new Error("Firebase Admin SDK failed to initialize due to missing credentials.");
  }
}

// Check again if initialization was successful before exporting
const adminInstance = admin.apps.length ? admin : null;
const adminAuth = adminInstance ? adminInstance.auth() : null;
const adminDb = adminInstance ? adminInstance.firestore() : null;

if (!adminInstance) {
    console.error("Firebase Admin SDK could not be initialized. Admin operations will fail.");
}

export { adminInstance as admin, adminAuth, adminDb };
