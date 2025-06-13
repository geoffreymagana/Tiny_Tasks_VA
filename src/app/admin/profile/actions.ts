
"use server";

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getAuth, updateProfile } from 'firebase/auth';
import { db, auth as clientAuth } from '@/lib/firebase'; // clientAuth for client-side access if needed, not directly here.
import type { User } from 'firebase/auth'; // For type reference if needed by admin SDK later

export interface UserProfileUpdateResult {
  success: boolean;
  message: string;
}

// This function needs to run in an environment with Firebase Admin SDK for updating Auth user directly,
// or handle it carefully if only client SDK is available (which it is here for `updateProfile`).
// For updating Firestore, current setup is fine.
// For updating Auth user's displayName, `updateProfile` from client SDK is usually used by the current user.
// If an admin were to update another user's Auth profile, Admin SDK would be needed in a Cloud Function.
// Here, we assume the logged-in user is updating their own profile.

export async function updateUserProfileServerAction(
  userId: string,
  newDisplayName: string
): Promise<UserProfileUpdateResult> {
  if (!userId) {
    return { success: false, message: 'User ID not provided.' };
  }
  if (!newDisplayName || newDisplayName.trim().length < 2) {
    return { success: false, message: 'Display name is invalid.' };
  }

  try {
    // Update Firestore user document
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      displayName: newDisplayName,
      updatedAt: new Date().toISOString(), // Or serverTimestamp() if preferred and handled correctly
    });

    // Update Firebase Auth display name
    // This part is tricky with server actions if not using Admin SDK.
    // For a user updating their OWN profile, `getAuth().currentUser` and `updateProfile`
    // are typically client-side.
    // Let's assume this server action is called by an authenticated user
    // and we attempt to update the auth profile.
    // A more robust way for this Auth update might be to do it client-side after this action succeeds,
    // or call a specific Cloud Function with Admin SDK.

    // The Firebase Admin SDK is NOT available in "use server" actions directly
    // without a custom setup. We will rely on the client to have an active auth session.
    // This update will apply to the *currently signed-in user on the server*
    // if this action is called in a context where auth is readily available.
    // For simplicity, we'll proceed, but this auth update part is less robust than Firestore.

    // **Important Caveat:**
    // `getAuth()` in a "use server" context for `next/firebase` might not behave
    // as expected for getting the *current calling user*.
    // `updateProfile` is a client SDK method.
    // A better approach for updating Auth profile from server action often involves a dedicated callable function.
    // However, for updating `displayName` of the calling user, this *might* work if Firebase JS SDK's auth state
    // is correctly managed by Next.js on the server for server actions.
    // For now, we'll try, and if it fails, the Firestore part will still succeed.
    
    // Let's simulate how one *might* try this, understanding its limitations.
    // The `currentUser` from `getAuth()` in a server action context is often null or not the calling user.
    // This part likely needs a Firebase Admin SDK in a proper backend (e.g., Cloud Function)
    // or careful client-side handling after the server action.

    // For now, we will OMIT the direct Firebase Auth update from the server action
    // as it's more reliably done client-side after a successful Firestore update,
    // or via a callable function using the Admin SDK.
    // The client-side useAdminAuth hook should reflect the Firestore change upon re-render.

    // If you truly need to update Firebase Auth displayName from a server action,
    // you'd usually call a Cloud Function that uses the Admin SDK:
    // e.g., admin.auth().updateUser(userId, { displayName: newDisplayName });
    
    // For now, we'll only update Firestore and let the client handle Auth profile update if needed.
    // The `useAdminAuth` hook will refresh `userData` from Firestore.

    return { success: true, message: 'Profile name updated in database.' };

  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return { success: false, message: error.message || 'Failed to update profile.' };
  }
}

    