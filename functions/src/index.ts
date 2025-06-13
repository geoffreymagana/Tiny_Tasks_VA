
import {onCall} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions"; // Changed from 'import type'

admin.initializeApp();

interface CreateStaffData {
  email: string;
  password?: string; // Password might be optional if you always use a default
  displayName: string;
  department: string;
}

// Callable function to create a staff Auth user and their user document
export const createStaffAuthUser = onCall(
  async (request: functions.https.CallableRequest<CreateStaffData>) => {
    // Optional: Admin check for v2 (context is part of request.auth)
    // if (!request.auth || !request.auth.token.admin) {
    //   throw new functions.https.HttpsError('permission-denied', 'Must be an administrative user to perform this action.');
    // }

    const {email, password, displayName, department} = request.data;
    const effectivePassword = password || "password123"; // Use default

    if (!email || !displayName || !department) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields: email, displayName, department."
      );
    }

    try {
      const userRecord = await admin.auth().createUser({
        email: email,
        password: effectivePassword,
        displayName: displayName,
        emailVerified: false,
      });

      await admin.firestore().collection("users").doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: email,
        displayName: displayName,
        role: "staff",
        department: department,
        isDisabled: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        uid: userRecord.uid,
        message: "Staff Auth user and Firestore record created.",
      };
    } catch (error: unknown) {
      console.error("Error creating staff Auth user:", error);
      let errorMessage = "Failed to create staff user.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new functions.https.HttpsError("internal", errorMessage);
    }
  }
);

interface DeleteStaffData {
  uid: string;
}

// Callable function to delete a staff Auth user and their user document
export const deleteStaffAuthUser = onCall(
  async (request: functions.https.CallableRequest<DeleteStaffData>) => {
    // Optional: Admin check
    // if (!request.auth || !request.auth.token.admin) {
    //   throw new functions.https.HttpsError('permission-denied', 'Must be an administrative user to perform this action.');
    // }

    const uid = request.data.uid;
    if (!uid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required field: uid."
      );
    }

    try {
      await admin.auth().deleteUser(uid);
      await admin.firestore().collection("users").doc(uid).delete();
      return {
        success: true,
        message: "Staff Auth user and Firestore record deleted.",
      };
    } catch (error: unknown) {
      console.error("Error deleting staff Auth user:", error);
      let errorMessage = "Failed to delete staff user.";
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message.includes("auth/user-not-found")) { // More robust check
          try {
            await admin.firestore().collection("users").doc(uid).delete();
            return {
              success: true,
              message: "Auth user not found (already deleted?), Firestore record deleted.",
            };
          } catch (fsError: unknown) {
            console.error(
              "Error deleting Firestore user record after auth/user-not-found:",
              fsError
            );
            if (fsError instanceof Error) {
              errorMessage = fsError.message;
            } else {
              errorMessage = "Failed to delete staff user record.";
            }
            throw new functions.https.HttpsError("internal", errorMessage);
          }
        }
      }
      throw new functions.https.HttpsError("internal", errorMessage);
    }
  }
);

// Example of an HTTP function (if you had one, otherwise remove)
// import {onRequest} from "firebase-functions/v2/onRequest";
// import * as logger from "firebase-functions/logger";
// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
