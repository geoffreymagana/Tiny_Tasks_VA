
'use server';

import { doc, getDoc, setDoc, serverTimestamp, Timestamp, collection, addDoc, updateDoc, deleteDoc, query, orderBy, where, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function verifyAdmin(adminUserId: string): Promise<boolean> {
  if (!adminUserId) return false;
  const adminDocRef = doc(db, 'users', adminUserId);
  const adminDoc = await getDoc(adminDocRef);
  return adminDoc.exists() && adminDoc.data()?.role === 'admin';
}

export interface SectionData {
  id?: string; // Added for general use, though not always directly from this collection's ID
  imageUrl: string | null;
  title: string | null;
  text: string | null;
  isVisible?: boolean; 
  updatedAt?: string | null;
}

export interface PortfolioItem {
  id?: string;
  title: string;
  description: string;
  imageUrl: string; // Direct image link
  imageHint: string; // For data-ai-hint
  order?: number;
  isVisible?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface SectionOperationResult {
  success: boolean;
  message: string;
  sectionData?: Partial<SectionData>;
}

export interface PortfolioOperationResult {
  success: boolean;
  message: string;
  portfolioItemId?: string;
}

const SECTIONS_COLLECTION = 'websiteSectionImages'; // Keeping name for now
const PORTFOLIO_COLLECTION = 'portfolioItems';

const convertDbTimestampToISOForCmsActions = (dbTimestamp: any): string | null => {
  if (!dbTimestamp) return null;
  if (dbTimestamp instanceof Timestamp) { return dbTimestamp.toDate().toISOString(); }
  if (dbTimestamp instanceof Date) { return dbTimestamp.toISOString(); }
  if (typeof dbTimestamp === 'object' && dbTimestamp !== null && 
      typeof dbTimestamp.seconds === 'number' && typeof dbTimestamp.nanoseconds === 'number') {
    try { return new Timestamp(dbTimestamp.seconds, dbTimestamp.nanoseconds).toDate().toISOString(); }
    catch (e) { console.warn("Error converting object with sec/ns to Timestamp for CMS actions:", e, dbTimestamp); return null; }
  }
  if (typeof dbTimestamp === 'object' && dbTimestamp !== null && typeof dbTimestamp.toDate === 'function') {
    try {
      const dateObj = dbTimestamp.toDate();
      if (dateObj instanceof Date && !isNaN(dateObj.getTime())) { return dateObj.toISOString(); }
      console.warn("toDate() did not return valid Date for CMS actions:", dbTimestamp);
      return new Date().toISOString(); // Fallback for uncommitted server timestamps
    } catch (e) { console.warn("Failed to convert object with toDate method for CMS actions:", e, dbTimestamp); return null; }
  }
  if (typeof dbTimestamp === 'string') {
    const d = new Date(dbTimestamp);
    if (!isNaN(d.getTime())) { return d.toISOString(); }
    console.warn("Invalid date string for CMS actions:", dbTimestamp); return null;
  }
  console.warn("Unparseable timestamp for CMS actions:", dbTimestamp); return null;
};

export async function getSectionDataAction(sectionId: string): Promise<SectionData | null> {
  try {
    const sectionDocRef = doc(db, SECTIONS_COLLECTION, sectionId);
    const docSnap = await getDoc(sectionDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        imageUrl: data.imageUrl || null,
        title: data.title || null,
        text: data.text || null,
        isVisible: data.isVisible === undefined ? true : data.isVisible,
        updatedAt: convertDbTimestampToISOForCmsActions(data.updatedAt),
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


// Portfolio Item Actions
export async function addPortfolioItemAction(
  itemData: Omit<PortfolioItem, 'id' | 'createdAt' | 'updatedAt'>,
  adminUserId: string
): Promise<PortfolioOperationResult> {
  if (!(await verifyAdmin(adminUserId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }
  try {
    const dataToSave = {
      ...itemData,
      isVisible: itemData.isVisible === undefined ? true : itemData.isVisible,
      order: itemData.order === undefined ? 0 : itemData.order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, PORTFOLIO_COLLECTION), dataToSave);
    return { success: true, message: 'Portfolio item added successfully!', portfolioItemId: docRef.id };
  } catch (error: any) {
    console.error('Error adding portfolio item:', error);
    return { success: false, message: error.message || 'Failed to add portfolio item.' };
  }
}

export async function getPortfolioItemsAction(): Promise<PortfolioItem[]> {
  try {
    const q = query(collection(db, PORTFOLIO_COLLECTION), orderBy('order', 'asc'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        imageUrl: data.imageUrl || '',
        imageHint: data.imageHint || '',
        order: data.order === undefined ? 0 : data.order,
        isVisible: data.isVisible === undefined ? true : data.isVisible,
        createdAt: convertDbTimestampToISOForCmsActions(data.createdAt),
        updatedAt: convertDbTimestampToISOForCmsActions(data.updatedAt),
      } as PortfolioItem;
    });
  } catch (error) {
    console.error('Error fetching portfolio items:', error);
    return [];
  }
}

export async function updatePortfolioItemAction(
  itemId: string,
  itemData: Omit<PortfolioItem, 'id' | 'createdAt' | 'updatedAt'>,
  adminUserId: string
): Promise<PortfolioOperationResult> {
  if (!(await verifyAdmin(adminUserId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }
  try {
    const itemRef = doc(db, PORTFOLIO_COLLECTION, itemId);
    const dataToUpdate = {
        ...itemData,
        isVisible: itemData.isVisible === undefined ? true : itemData.isVisible,
        order: itemData.order === undefined ? 0 : itemData.order,
        updatedAt: serverTimestamp()
    };
    await updateDoc(itemRef, dataToUpdate);
    return { success: true, message: 'Portfolio item updated successfully!', portfolioItemId: itemId };
  } catch (error: any) {
    console.error(`Error updating portfolio item ${itemId}:`, error);
    return { success: false, message: error.message || 'Failed to update portfolio item.' };
  }
}

export async function deletePortfolioItemAction(
  itemId: string,
  adminUserId: string
): Promise<PortfolioOperationResult> {
  if (!(await verifyAdmin(adminUserId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }
  try {
    const itemRef = doc(db, PORTFOLIO_COLLECTION, itemId);
    await deleteDoc(itemRef);
    return { success: true, message: 'Portfolio item deleted successfully!' };
  } catch (error: any) {
    console.error(`Error deleting portfolio item ${itemId}:`, error);
    return { success: false, message: error.message || 'Failed to delete portfolio item.' };
  }
}
