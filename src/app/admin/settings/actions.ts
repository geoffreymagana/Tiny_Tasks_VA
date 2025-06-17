
"use server";

import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface AgencySettingsData {
  agencyName?: string | null;
  agencyLogoUrl?: string | null;
  agencyBannerUrl?: string | null;
  theme?: 'light' | 'dark' | 'custom';
  timezone?: string | null;
  defaultCurrency?: string | null;
  updatedAt?: string | null; // Added to reflect the actual data structure
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

// Helper to convert Firestore Timestamp to ISO string
const convertDbTimestampToISOForSettings = (dbTimestamp: any): string | null => {
  if (!dbTimestamp) return null;
  if (dbTimestamp instanceof Timestamp) { return dbTimestamp.toDate().toISOString(); }
  if (dbTimestamp instanceof Date) { return dbTimestamp.toISOString(); }
  if (typeof dbTimestamp === 'object' && dbTimestamp !== null && 
      typeof dbTimestamp.seconds === 'number' && typeof dbTimestamp.nanoseconds === 'number') {
    try { return new Timestamp(dbTimestamp.seconds, dbTimestamp.nanoseconds).toDate().toISOString(); }
    catch (e) { console.warn("Error converting object with sec/ns to Timestamp for settings:", e, dbTimestamp); return null; }
  }
  if (typeof dbTimestamp === 'object' && dbTimestamp !== null && typeof dbTimestamp.toDate === 'function') {
    try {
      const dateObj = dbTimestamp.toDate();
      if (dateObj instanceof Date && !isNaN(dateObj.getTime())) { return dateObj.toISOString(); }
      console.warn("toDate() did not return valid Date for settings:", dbTimestamp);
      return new Date().toISOString(); // Fallback for uncommitted server timestamps or similar
    } catch (e) { console.warn("Failed to convert object with toDate method for settings:", e, dbTimestamp); return null; }
  }
  if (typeof dbTimestamp === 'string') {
    const d = new Date(dbTimestamp);
    if (!isNaN(d.getTime())) { return d.toISOString(); } // Already an ISO string or valid date string
    console.warn("Invalid date string for settings:", dbTimestamp); return null;
  }
  console.warn("Unparseable timestamp format for settings:", dbTimestamp); return null;
};


export async function getAgencySettingsAction(): Promise<AgencySettingsData | null> {
  try {
    const settingsDocRef = doc(db, SETTINGS_DOC_PATH);
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Ensure all fields are present or null, and timestamps are converted
      return {
        agencyName: data.agencyName || null,
        agencyLogoUrl: data.agencyLogoUrl || null,
        agencyBannerUrl: data.agencyBannerUrl || null,
        theme: data.theme || 'light',
        timezone: data.timezone || null,
        defaultCurrency: data.defaultCurrency || null,
        updatedAt: convertDbTimestampToISOForSettings(data.updatedAt), // Serialize timestamp
      } as AgencySettingsData;
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
    const dataToUpdate: any = { // Use 'any' temporarily for flexibility before stricter typing
      ...settingsUpdate,
      updatedAt: serverTimestamp(), // Firestore will convert this to a Timestamp
    };

    // Remove undefined fields to avoid overwriting with undefined if only partial update
    Object.keys(dataToUpdate).forEach(key => {
        const K = key as keyof typeof dataToUpdate;
        if (dataToUpdate[K] === undefined) {
            delete dataToUpdate[K];
        }
    });
    
    await setDoc(settingsDocRef, dataToUpdate, { merge: true });
    
    // Fetch the updated document to return the full data, now with converted timestamp
    const updatedSettings = await getAgencySettingsAction();

    return { success: true, message: 'Agency settings updated successfully.', data: updatedSettings || undefined };
  } catch (error: any) {
    console.error('Error updating agency settings:', error);
    return { success: false, message: error.message || 'Failed to update agency settings.' };
  }
}
