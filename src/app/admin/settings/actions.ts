
"use server";

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface AgencySettingsData {
  agencyName?: string | null;
  agencyLogoUrl?: string | null;
  agencyBannerUrl?: string | null;
  theme?: 'light' | 'dark' | 'custom';
  timezone?: string | null;
  defaultCurrency?: string | null;
  // Add other settings fields as needed
}

export interface SettingsOperationResult {
  success: boolean;
  message: string;
  data?: AgencySettingsData;
}

const SETTINGS_DOC_PATH = 'settings/agencyDetails'; // Single document for all agency settings

async function verifyAdmin(adminUserId: string): Promise<boolean> {
  if (!adminUserId) return false;
  const adminDocRef = doc(db, 'users', adminUserId);
  const adminDoc = await getDoc(adminDocRef);
  return adminDoc.exists() && adminDoc.data()?.role === 'admin';
}

export async function getAgencySettingsAction(): Promise<AgencySettingsData | null> {
  try {
    const settingsDocRef = doc(db, SETTINGS_DOC_PATH);
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as AgencySettingsData;
    }
    return null; // No settings configured yet
  } catch (error) {
    console.error("Error fetching agency settings:", error);
    return null;
  }
}

export async function updateAgencySettingsAction(
  settingsUpdate: Partial<AgencySettingsData>,
  adminUserId: string
): Promise<SettingsOperationResult> {
  if (!(await verifyAdmin(adminUserId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  if (Object.keys(settingsUpdate).length === 0) {
    return { success: false, message: 'No settings provided to update.' };
  }

  try {
    const settingsDocRef = doc(db, SETTINGS_DOC_PATH);
    const dataToUpdate = {
      ...settingsUpdate,
      updatedAt: serverTimestamp(),
    };

    // Remove undefined fields to avoid overwriting with undefined if only partial update
    Object.keys(dataToUpdate).forEach(key => {
        const K = key as keyof typeof dataToUpdate;
        if (dataToUpdate[K] === undefined) {
            delete dataToUpdate[K];
        }
    });
    
    await setDoc(settingsDocRef, dataToUpdate, { merge: true });
    
    // Fetch the updated document to return the full data
    const updatedDocSnap = await getDoc(settingsDocRef);
    const updatedData = updatedDocSnap.exists() ? updatedDocSnap.data() as AgencySettingsData : null;

    return { success: true, message: 'Agency settings updated successfully.', data: updatedData || undefined };
  } catch (error: any) {
    console.error('Error updating agency settings:', error);
    return { success: false, message: error.message || 'Failed to update agency settings.' };
  }
}
