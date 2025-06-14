
'use server';

import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Helper function to verify admin (can be shared if used elsewhere)
async function verifyAdmin(adminUserId: string): Promise<boolean> {
  if (!adminUserId) return false;
  const adminDocRef = doc(db, 'users', adminUserId);
  const adminDoc = await getDoc(adminDocRef);
  return adminDoc.exists() && adminDoc.data()?.role === 'admin';
}

export interface SectionData {
  imageUrl: string | null;
  title: string | null;
  text: string | null;
  updatedAt?: string | null;
}

export interface SectionOperationResult {
  success: boolean;
  message: string;
  sectionData?: Partial<SectionData>;
}

const SECTIONS_COLLECTION = 'websiteSectionImages'; // Keeping collection name for now

export async function getSectionDataAction(sectionId: string): Promise<SectionData | null> {
  try {
    const sectionDocRef = doc(db, SECTIONS_COLLECTION, sectionId);
    const docSnap = await getDoc(sectionDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const updatedAtISO = data.updatedAt instanceof Timestamp 
        ? data.updatedAt.toDate().toISOString() 
        : (data.updatedAt && typeof data.updatedAt === 'string' ? data.updatedAt : undefined);
      
      return {
        imageUrl: data.imageUrl || null,
        title: data.title || null,
        text: data.text || null,
        updatedAt: updatedAtISO,
      };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching data for section ${sectionId}:`, error);
    return null;
  }
}

export async function updateSectionDataAction(
  sectionId: string,
  data: { imageUrl?: string | null; title?: string | null; text?: string | null },
  adminUserId: string
): Promise<SectionOperationResult> {
  if (!(await verifyAdmin(adminUserId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  if (!sectionId) {
    return { success: false, message: 'Section ID is required.' };
  }

  const sectionDocRef = doc(db, SECTIONS_COLLECTION, sectionId);
  const dataToUpdate: any = { updatedAt: serverTimestamp() };

  // Explicitly handle null or undefined for clearing fields, or set the new value
  if (data.hasOwnProperty('imageUrl')) {
    if (data.imageUrl === null || (typeof data.imageUrl === 'string' && data.imageUrl.trim() === '')) {
        dataToUpdate.imageUrl = null;
    } else if (typeof data.imageUrl === 'string') {
        try {
            new URL(data.imageUrl); // Basic URL validation
            dataToUpdate.imageUrl = data.imageUrl;
        } catch (_) {
            return { success: false, message: 'Invalid image URL format provided.' };
        }
    }
  }


  if (data.hasOwnProperty('title')) {
    dataToUpdate.title = data.title === null || (typeof data.title === 'string' && data.title.trim() === '') ? null : data.title;
  }
  if (data.hasOwnProperty('text')) {
    dataToUpdate.text = data.text === null || (typeof data.text === 'string' && data.text.trim() === '') ? null : data.text;
  }
  
  // If only updatedAt is in dataToUpdate (meaning no actual content fields were changed),
  // we might not want to make a write unless truly necessary.
  // However, for simplicity of update logic, we'll proceed.
  // A more complex check could see if other fields than `updatedAt` are present.

  try {
    await setDoc(sectionDocRef, dataToUpdate, { merge: true });
    // Return the data that was intended to be saved for UI update
    const returnData: Partial<SectionData> = {};
    if (data.hasOwnProperty('imageUrl')) returnData.imageUrl = dataToUpdate.imageUrl;
    if (data.hasOwnProperty('title')) returnData.title = dataToUpdate.title;
    if (data.hasOwnProperty('text')) returnData.text = dataToUpdate.text;

    return { success: true, message: `Content for section '${sectionId}' updated successfully.`, sectionData: returnData };
  } catch (error: any) {
    console.error(`Error updating data for section ${sectionId}:`, error);
    return { success: false, message: error.message || 'Failed to update section content.' };
  }
}
