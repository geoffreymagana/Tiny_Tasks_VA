
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
import { format, add } from 'date-fns';
import { InvoiceSchema, type InvoiceItem, type Invoice, type InvoiceStatus, type CreateInvoiceFormValues } from './schema';

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

function calculateItemTotal(item: InvoiceItem): number {
  return item.quantity * item.unitPrice;
}

function calculateSubTotalAmount(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
}

function calculateTotalAmount(subTotal: number, tax: number = 0, discount: number = 0): number {
    return subTotal + tax - discount;
}


async function generateInvoiceNumber(): Promise<string> {
  const prefix = "TTVA"; // Tiny Tasks Virtual Assistant
  const datePart = format(new Date(), "yyyyMM"); // Year and Month
  
  const invoicesRef = collection(db, 'invoices');
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthEnd = add(monthStart, { months: 1 });

  const q = query(invoicesRef, 
                where('createdAt', '>=', Timestamp.fromDate(monthStart)),
                where('createdAt', '<', Timestamp.fromDate(monthEnd))
              );
  const snapshot = await getDocs(q);
  const count = snapshot.size + 1; 
  
  return `${prefix}-${datePart}-${String(count).padStart(4, '0')}`;
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
  formData: Omit<CreateInvoiceFormValues, 'issueDate' | 'dueDate'> & { 
    issueDate: string; 
    dueDate: string;
    senderName?: string | null;
    senderEmail?: string | null;
    senderPhone?: string | null;
    senderAddress?: string | null;
  },
  adminId: string
): Promise<InvoiceOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  try {
    const subTotalAmount = calculateSubTotalAmount(formData.items);
    const totalAmount = calculateTotalAmount(subTotalAmount, formData.taxAmount, formData.discountAmount);
    
    const invoiceNumber = await generateInvoiceNumber();

    const dataToSave: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
      ...formData,
      invoiceNumber,
      subTotalAmount,
      totalAmount,
      adminId,
      issueDate: formData.issueDate, 
      dueDate: formData.dueDate,     
      paidAt: formData.status === 'paid' ? serverTimestamp() : null,
      // Sender details passed from formData
      senderName: formData.senderName || null,
      senderEmail: formData.senderEmail || null,
      senderPhone: formData.senderPhone || null,
      senderAddress: formData.senderAddress || null,
      createdAt: serverTimestamp(), 
      updatedAt: serverTimestamp(),
    };
    
    const validatedData = InvoiceSchema.omit({id: true, createdAt: true, updatedAt: true}).safeParse(dataToSave);
    if (!validatedData.success) {
        console.error("Server-side validation errors:", validatedData.error.flatten().fieldErrors);
        return { success: false, message: `Server-side validation failed: ${JSON.stringify(validatedData.error.flatten().fieldErrors)}` };
    }

    const docRef = await addDoc(collection(db, 'invoices'), {
        ...validatedData.data, 
        createdAt: serverTimestamp(), 
        updatedAt: serverTimestamp()
    });
    return { success: true, message: 'Invoice created successfully!', invoiceId: docRef.id, invoiceNumber };
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return { success: false, message: error.message || 'Failed to create invoice.' };
  }
}

export async function getAllInvoicesAction(): Promise<Invoice[]> {
  try {
    const invoicesRef = collection(db, 'invoices');
    const q = query(invoicesRef, orderBy('issueDate', 'desc')); 
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
  updateData: Partial<Omit<Invoice, 'id' | 'invoiceNumber' | 'adminId' | 'createdAt' | 'updatedAt' | 'issueDate' | 'dueDate'>> & { 
    issueDate?: string; 
    dueDate?: string;
    senderName?: string | null;
    senderEmail?: string | null;
    senderPhone?: string | null;
    senderAddress?: string | null;
  },
  adminId: string
): Promise<InvoiceOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  const invoiceRef = doc(db, 'invoices', invoiceId);
  try {
    const currentDocSnap = await getDoc(invoiceRef);
    if (!currentDocSnap.exists()) {
      return { success: false, message: 'Invoice not found for update.' };
    }
    const currentData = currentDocSnap.data() as Invoice;

    const items = updateData.items || currentData.items;
    const subTotalAmount = calculateSubTotalAmount(items);
    const taxAmount = updateData.taxAmount !== undefined ? updateData.taxAmount : currentData.taxAmount;
    const discountAmount = updateData.discountAmount !== undefined ? updateData.discountAmount : currentData.discountAmount;
    const totalAmount = calculateTotalAmount(subTotalAmount, taxAmount, discountAmount);
    
    const dataToUpdate: any = {
      ...updateData, // includes client details, status, notes, and new sender details
      items,
      subTotalAmount,
      taxAmount,
      discountAmount,
      totalAmount,
      updatedAt: serverTimestamp(),
    };

    if (updateData.issueDate) dataToUpdate.issueDate = updateData.issueDate;
    if (updateData.dueDate) dataToUpdate.dueDate = updateData.dueDate;

    if (updateData.status === 'paid' && currentData.status !== 'paid') {
      dataToUpdate.paidAt = serverTimestamp();
    } else if (updateData.status && updateData.status !== 'paid' && currentData.status === 'paid') {
      dataToUpdate.paidAt = null; 
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
  
  let updateMessage = '';
  if (invoice.status === 'draft') {
    const updateResult = await updateInvoiceAction(invoiceId, { status: 'pending' }, adminId);
    if (updateResult.success) {
      updateMessage = " Status updated to 'Pending'.";
    } else {
      updateMessage = " Failed to update status to 'Pending'.";
    }
  }

  return { success: true, message: `Invoice ${invoice.invoiceNumber} has been marked for sending (simulation).${updateMessage}` };
}

