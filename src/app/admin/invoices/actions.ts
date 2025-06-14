
'use server';

import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  where,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { InvoiceSchema, type InvoiceItem, type Invoice, type InvoiceStatus } from './schema';

export interface InvoiceOperationResult {
  success: boolean;
  message: string;
  invoiceId?: string;
  invoiceNumber?: string;
}

// ----- Helper Functions -----
async function verifyAdmin(adminId: string): Promise<boolean> {
  if (!adminId) return false;
  const adminDocRef = doc(db, 'users', adminId);
  const adminDoc = await getDoc(adminDocRef);
  return adminDoc.exists() && adminDoc.data()?.role === 'admin';
}

function calculateTotalAmount(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
}

// Simple invoice number generator. For production, consider a more robust sequential or UUID-based approach.
async function generateInvoiceNumber(): Promise<string> {
  const prefix = "INV";
  const datePart = format(new Date(), "yyyyMMdd");
  
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `${prefix}-${datePart}-${randomSuffix}`;
}

const convertDbTimestamp = (timestamp: any): string | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (typeof timestamp === 'string') return timestamp;
  if (timestamp && typeof timestamp.toDate === 'function') {
    return new Date().toISOString(); 
  }
  return null;
};


// ----- Server Actions -----

export async function addInvoiceAction(
  invoiceData: Omit<Invoice, 'invoiceNumber' | 'totalAmount' | 'id' | 'createdAt' | 'updatedAt'>,
  adminId: string
): Promise<InvoiceOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  try {
    const validatedData = InvoiceSchema.omit({ 
        id: true, invoiceNumber: true, totalAmount: true, createdAt: true, updatedAt: true, adminId: true 
    }).safeParse(invoiceData);

    if (!validatedData.success) {
        console.error("Validation errors:", validatedData.error.flatten().fieldErrors);
        return { success: false, message: `Validation failed: ${JSON.stringify(validatedData.error.flatten().fieldErrors)}` };
    }
    
    const dataToSave = validatedData.data;

    const invoiceNumber = await generateInvoiceNumber();
    const totalAmount = calculateTotalAmount(dataToSave.items);

    const newInvoice: Omit<Invoice, 'id'> = {
      ...dataToSave,
      invoiceNumber,
      totalAmount,
      adminId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      paidAt: dataToSave.status === 'paid' ? serverTimestamp() : null,
    };

    const docRef = await addDoc(collection(db, 'invoices'), newInvoice);
    return { success: true, message: 'Invoice created successfully!', invoiceId: docRef.id, invoiceNumber };
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return { success: false, message: error.message || 'Failed to create invoice.' };
  }
}

export async function getAllInvoicesAction(): Promise<Invoice[]> {
  try {
    const invoicesRef = collection(db, 'invoices');
    const q = query(invoicesRef, orderBy('issueDate', 'desc')); // Sort by issue date, newest first
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        issueDate: convertDbTimestamp(data.issueDate) || new Date().toISOString(),
        dueDate: convertDbTimestamp(data.dueDate) || new Date().toISOString(),
        createdAt: convertDbTimestamp(data.createdAt),
        updatedAt: convertDbTimestamp(data.updatedAt),
        paidAt: convertDbTimestamp(data.paidAt),
      } as Invoice;
    });
  } catch (error) {
    console.error("Error fetching all invoices:", error);
    return [];
  }
}

export async function getInvoiceAction(invoiceId: string): Promise<Invoice | null> {
  try {
    const invoiceDocRef = doc(db, 'invoices', invoiceId);
    const invoiceDocSnap = await getDoc(invoiceDocRef);

    if (!invoiceDocSnap.exists()) {
      return null;
    }
    const data = invoiceDocSnap.data();
    return {
      id: invoiceDocSnap.id,
      ...data,
      issueDate: convertDbTimestamp(data.issueDate) || new Date().toISOString(),
      dueDate: convertDbTimestamp(data.dueDate) || new Date().toISOString(),
      createdAt: convertDbTimestamp(data.createdAt),
      updatedAt: convertDbTimestamp(data.updatedAt),
      paidAt: convertDbTimestamp(data.paidAt),
    } as Invoice;
  } catch (error) {
    console.error(`Error fetching invoice ${invoiceId}:`, error);
    return null;
  }
}

export async function updateInvoiceAction(
  invoiceId: string,
  updateData: Partial<Omit<Invoice, 'id' | 'invoiceNumber' | 'adminId' | 'createdAt' | 'updatedAt'>>, // Allow partial updates
  adminId: string
): Promise<InvoiceOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  const invoiceRef = doc(db, 'invoices', invoiceId);
  try {
    const currentDoc = await getDoc(invoiceRef);
    if (!currentDoc.exists()) {
      return { success: false, message: 'Invoice not found for update.' };
    }

    // Recalculate total if items are part of the update
    let totalAmount = currentDoc.data()?.totalAmount;
    if (updateData.items) {
      totalAmount = calculateTotalAmount(updateData.items);
    }
    
    const dataToUpdate: any = {
      ...updateData,
      totalAmount,
      updatedAt: serverTimestamp(),
    };

    if (updateData.status === 'paid' && currentDoc.data()?.status !== 'paid') {
      dataToUpdate.paidAt = serverTimestamp();
    } else if (updateData.status && updateData.status !== 'paid') {
      dataToUpdate.paidAt = null; // Remove paidAt if status changes from paid
    }
    
    await updateDoc(invoiceRef, dataToUpdate);
    return { success: true, message: 'Invoice updated successfully!', invoiceId };
  } catch (error: any) {
    console.error(`Error updating invoice ${invoiceId}:`, error);
    return { success: false, message: error.message || 'Failed to update invoice.' };
  }
}


export async function deleteInvoiceAction(
  invoiceId: string,
  adminId: string
): Promise<InvoiceOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }
  try {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    await deleteDoc(invoiceRef);
    return { success: true, message: 'Invoice deleted successfully!' };
  } catch (error: any) {
    console.error(`Error deleting invoice ${invoiceId}:`, error);
    return { success: false, message: error.message || 'Failed to delete invoice.' };
  }
}

export async function sendInvoiceAction(
  invoiceId: string,
  adminId: string
): Promise<InvoiceOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  const invoice = await getInvoiceAction(invoiceId);
  if (!invoice) {
    return { success: false, message: 'Invoice not found.' };
  }

  // Placeholder for actual email sending logic
  console.log(`Simulating sending invoice ${invoice.invoiceNumber} to ${invoice.clientEmail || invoice.clientName}`);
  
  if (invoice.status === 'draft') {
    await updateInvoiceAction(invoiceId, { status: 'pending' }, adminId);
  }

  return { success: true, message: `Invoice ${invoice.invoiceNumber} has been marked for sending (simulation).` };
}
