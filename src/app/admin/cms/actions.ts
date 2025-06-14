
'use server';

import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  isVisible?: boolean; // Added for visibility
  updatedAt?: string | null;
}

export interface SectionOperationResult {
  success: boolean;
  message: string;
  sectionData?: Partial<SectionData>;
}

const SECTIONS_COLLECTION = 'websiteSectionImages';

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
        isVisible: data.isVisible === undefined ? true : data.isVisible, // Default to true if not set
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
  data: { imageUrl?: string | null; title?: string | null; text?: string | null; isVisible?: boolean },
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

  if (data.hasOwnProperty('imageUrl')) {
    if (data.imageUrl === null || (typeof data.imageUrl === 'string' && data.imageUrl.trim() === '')) {
        dataToUpdate.imageUrl = null;
    } else if (typeof data.imageUrl === 'string') {
        try {
            new URL(data.imageUrl); 
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
  if (data.hasOwnProperty('isVisible')) {
    dataToUpdate.isVisible = data.isVisible;
  }
  
  try {
    await setDoc(sectionDocRef, dataToUpdate, { merge: true });
    const returnData: Partial<SectionData> = {};
    if (data.hasOwnProperty('imageUrl')) returnData.imageUrl = dataToUpdate.imageUrl;
    if (data.hasOwnProperty('title')) returnData.title = dataToUpdate.title;
    if (data.hasOwnProperty('text')) returnData.text = dataToUpdate.text;
    if (data.hasOwnProperty('isVisible')) returnData.isVisible = dataToUpdate.isVisible;

    return { success: true, message: `Content for section '${sectionId}' updated successfully.`, sectionData: returnData };
  } catch (error: any) {
    console.error(`Error updating data for section ${sectionId}:`, error);
    return { success: false, message: error.message || 'Failed to update section content.' };
  }
}
