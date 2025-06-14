
'use server';

import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from 'firebase/auth';

// Helper function to verify admin (can be shared if used elsewhere)
async function verifyAdmin(adminUserId: string): Promise<boolean> {
  if (!adminUserId) return false;
  const adminDocRef = doc(db, 'users', adminUserId);
  const adminDoc = await getDoc(adminDocRef);
  return adminDoc.exists() && adminDoc.data()?.role === 'admin';
}

export interface SectionImage {
  imageUrl: string | null;
  updatedAt?: string; // Changed to string for ISO date
}

export interface SectionImageOperationResult {
  success: boolean;
  message: string;
  imageUrl?: string | null;
}

const SECTION_IMAGES_COLLECTION = 'websiteSectionImages';

export async function getSectionImageAction(sectionId: string): Promise<SectionImage | null> {
  try {
    const sectionDocRef = doc(db, SECTION_IMAGES_COLLECTION, sectionId);
    const docSnap = await getDoc(sectionDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Convert Firestore Timestamp to ISO string
      const updatedAtISO = data.updatedAt instanceof Timestamp 
        ? data.updatedAt.toDate().toISOString() 
        : undefined;
      
      return {
        imageUrl: data.imageUrl || null,
        updatedAt: updatedAtISO,
      };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching image for section ${sectionId}:`, error);
    return null;
  }
}

export async function updateSectionImageAction(
  sectionId: string,
  imageUrl: string | null,
  adminUserId: string
): Promise<SectionImageOperationResult> {
  if (!(await verifyAdmin(adminUserId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  if (!sectionId) {
    return { success: false, message: 'Section ID is required.' };
  }

  const sectionDocRef = doc(db, SECTION_IMAGES_COLLECTION, sectionId);

  try {
    if (imageUrl === null || imageUrl.trim() === '') {
      // If imageUrl is null or empty, delete the document or specific field to clear it
      const docSnap = await getDoc(sectionDocRef);
      if (docSnap.exists()) {
        await deleteDoc(sectionDocRef);
      }
      return { success: true, message: `Image for section '${sectionId}' cleared successfully.`, imageUrl: null };
    } else {
      // Validate URL format (basic check)
      try {
        new URL(imageUrl);
      } catch (_) {
        return { success: false, message: 'Invalid image URL format.' };
      }

      await setDoc(sectionDocRef, { 
        imageUrl: imageUrl,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return { success: true, message: `Image for section '${sectionId}' updated successfully.`, imageUrl: imageUrl };
    }
  } catch (error: any) {
    console.error(`Error updating image for section ${sectionId}:`, error);
    return { success: false, message: error.message || 'Failed to update section image.' };
  }
}

