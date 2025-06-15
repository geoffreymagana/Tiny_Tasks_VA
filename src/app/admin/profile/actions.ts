
"use server";

import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface UserProfileUpdateResult {
  success: boolean;
  message: string;
}

export async function updateUserProfileServerAction(
  userId: string,
  updates: { 
    displayName?: string;
    photoURL?: string | null;
    bannerURL?: string | null;
  }
): Promise<UserProfileUpdateResult> {
  if (!userId) {
    return { success: false, message: 'User ID not provided.' };
  }

  if (updates.displayName && updates.displayName.trim().length < 2) {
    return { success: false, message: 'Display name is invalid.' };
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const dataToUpdate: any = { ...updates, updatedAt: serverTimestamp() };

    // Remove undefined fields from updates to avoid overwriting with undefined
    Object.keys(dataToUpdate).forEach(key => {
      if (dataToUpdate[key] === undefined) {
        delete dataToUpdate[key];
      }
    });
    
    await updateDoc(userDocRef, dataToUpdate);
    
    return { success: true, message: 'Profile updated successfully in database.' };

  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return { success: false, message: error.message || 'Failed to update profile.' };
  }
}
