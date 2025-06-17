
// import {onCall} from "firebase-functions/v2/https";
// import * as admin from "firebase-admin";
// import * as functions from "firebase-functions"; // Changed from 'import type'

// admin.initializeApp();

// interface CreateStaffData {
//   email: string;
//   password?: string; 
//   displayName: string;
//   department: string;
// }

// Callable function to create a staff Auth user and their user document
// export const createStaffAuthUser = onCall(
//   async (request: functions.https.CallableRequest<CreateStaffData>) => {
//     // Optional: Admin check for v2 (context is part of request.auth)
//     // if (!request.auth || !request.auth.token.admin) {
//     //   throw new functions.https.HttpsError('permission-denied',
//     // 'Must be an administrative user to perform this action.');
//     // }

//     const {email, password, displayName, department} = request.data;
//     const effectivePassword = password || "password123"; // Use default if not provided

//     if (!email || !displayName || !department) {
//       throw new functions.https.HttpsError(
//         "invalid-argument",
//         "Missing required fields: email, displayName, department."
//       );
//     }

//     try {
//       const userRecord = await admin.auth().createUser({
//         email: email,
//         password: effectivePassword,
//         displayName: displayName,
//         emailVerified: false, // Or true, depending on your flow
//       });

//       // Create user document in /users collection
//       await admin.firestore().collection("users").doc(userRecord.uid).set({
//         uid: userRecord.uid,
//         email: email,
//         displayName: displayName,
//         role: "staff", // Set role to staff
//         department: department,
//         isDisabled: false,
//         createdAt: admin.firestore.FieldValue.serverTimestamp(),
//         updatedAt: admin.firestore.FieldValue.serverTimestamp(),
//       });
      
//       // Optionally, also create/update a document in a dedicated /staff collection if you use one
//       // For example:
//       // await admin.firestore().collection("staff").doc(userRecord.uid).set({ /* staff specific details */ });


//       return {
//         success: true,
//         uid: userRecord.uid,
//         message: "Staff Auth user and Firestore record created successfully.",
//       };
//     } catch (error: unknown) {
//       console.error("Error creating staff Auth user:", error);
//       let errorMessage = "Failed to create staff user.";
//       if (error instanceof Error) {
//         errorMessage = error.message;
//       }
//       throw new functions.https.HttpsError("internal", errorMessage);
//     }
//   }
// );

// interface DeleteStaffData {
//   uid: string;
// }

// // Callable function to delete a staff Auth user and their user document
// export const deleteStaffAuthUser = onCall(
//   async (request: functions.https.CallableRequest<DeleteStaffData>) => {
//     // Optional: Admin check
//     // if (!request.auth || !request.auth.token.admin) {
//     //   throw new functions.https.HttpsError('permission-denied',
//     // 'Must be an administrative user to perform this action.');
//     // }

//     const uid = request.data.uid;
//     if (!uid) {
//       throw new functions.https.HttpsError(
//         "invalid-argument",
//         "Missing required field: uid."
//       );
//     }

//     try {
//       // Delete from Firebase Auth
//       await admin.auth().deleteUser(uid);
      
//       // Delete from Firestore /users collection
//       await admin.firestore().collection("users").doc(uid).delete();
      
//       // Optionally, also delete from a dedicated /staff collection if you use one
//       // For example:
//       // await admin.firestore().collection("staff").doc(uid).delete();


//       return {
//         success: true,
//         message: "Staff Auth user and Firestore record deleted successfully.",
//       };
//     } catch (error: unknown) {
//       console.error("Error deleting staff Auth user:", error);
//       let errorMessage = "Failed to delete staff user.";
//       if (error instanceof Error) {
//         errorMessage = error.message;
//         // Check if user was already deleted or not found in Auth, still try to delete from Firestore
//         if (error.message.includes("auth/user-not-found")) {
//           try {
//             await admin.firestore().collection("users").doc(uid).delete();
//             // Optionally delete from /staff as well
//             // await admin.firestore().collection("staff").doc(uid).delete();
//             return {
//               success: true,
//               message: "Auth user not found (already deleted?), Firestore record(s) deleted.",
//             };
//           } catch (fsError: unknown) {
//             let fsErrorMessage = "Firestore deletion failed after auth/user-not-found.";
//             if (fsError instanceof Error) fsErrorMessage = fsError.message;
//             console.error("Error deleting Firestore user record after auth/user-not-found:", fsError);
//             throw new functions.https.HttpsError("internal", fsErrorMessage);
//           }
//         }
//       }
//       throw new functions.https.HttpsError("internal", errorMessage);
//     }
//   }
// );


// Your other Cloud Functions (if any) would remain here.
// For example:
// import {onRequest} from "firebase-functions/v2/onRequest";
// import * as logger from "firebase-functions/logger";
// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
console.log("Cloud Functions index.ts loaded. Staff creation/deletion functions are now handled by Next.js backend.");

// If you have no other functions, this file can be minimal or even empty if your deployment process allows.
// However, firebase-functions tooling might expect some exports or an initialized admin app.
// For now, keeping the admin.initializeApp() (if it was here and used by other functions)
// or just logging is fine. If this is the only file, ensure your firebase.json doesn't try to deploy
// non-existent function entry points.

// If admin was initialized:
// if (!admin.apps.length) {
//   admin.initializeApp();
// }

// Exporting an empty object or a simple http function if required by deployment
export {}; // Ensures it's treated as a module

