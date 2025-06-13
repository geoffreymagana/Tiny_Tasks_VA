
'use server';

import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { z } from 'zod';

// Zod schema for client form data validation
const ClientFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().email("Invalid email address.").max(100),
  company: z.string().max(100).optional().or(z.literal('')), // Allow empty string
  phone: z.string().max(20).optional().or(z.literal('')), // Allow empty string
});

export type ClientFormData = z.infer<typeof ClientFormSchema>;

export interface Client extends ClientFormData {
  id: string;
  createdAt: any;
  updatedAt: any;
}

export interface ClientOperationResult {
  success: boolean;
  message: string;
  clientId?: string;
}

// Helper function to verify admin
async function verifyAdmin(adminId: string): Promise<boolean> {
  if (!adminId) return false;
  const adminDocRef = doc(db, 'users', adminId);
  const adminDoc = await getDoc(adminDocRef);
  return adminDoc.exists() && adminDoc.data()?.role === 'admin';
}

// Helper function to check if email is unique
async function isEmailUnique(email: string, currentClientId?: string): Promise<boolean> {
  const q = query(collection(db, 'clients'), where('email', '==', email));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return true;
  }
  // If we are updating and the found email belongs to the current client, it's still "unique" in this context
  if (currentClientId && querySnapshot.docs[0].id === currentClientId) {
    return true;
  }
  return false;
}

export async function addClientAction(
  clientData: ClientFormData,
  adminId: string
): Promise<ClientOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  if (!(await isEmailUnique(clientData.email))) {
    return { success: false, message: 'This email address is already in use by another client.' };
  }

  try {
    const newClient = {
      ...clientData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'clients'), newClient);
    return { success: true, message: 'Client added successfully!', clientId: docRef.id };
  } catch (error: any) {
    console.error('Error adding client:', error);
    return { success: false, message: error.message || 'Failed to add client.' };
  }
}

export async function getAllClientsAction(): Promise<Client[]> {
  try {
    const querySnapshot = await getDocs(query(collection(db, 'clients'), orderBy('createdAt', 'desc')));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        email: data.email,
        company: data.company || '',
        phone: data.phone || '',
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as Client;
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}

export async function getClientAction(clientId: string): Promise<Client | null> {
  try {
    const clientDocRef = doc(db, 'clients', clientId);
    const clientDocSnap = await getDoc(clientDocRef);

    if (!clientDocSnap.exists()) {
      return null;
    }
    const data = clientDocSnap.data();
    return {
      id: clientDocSnap.id,
      name: data.name,
      email: data.email,
      company: data.company || '',
      phone: data.phone || '',
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    } as Client;
  } catch (error) {
    console.error("Error fetching client:", error);
    return null;
  }
}

export async function updateClientAction(
  clientId: string,
  clientData: ClientFormData,
  adminId: string
): Promise<ClientOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  const clientRef = doc(db, 'clients', clientId);
  const clientSnap = await getDoc(clientRef);
  if (!clientSnap.exists()) {
    return { success: false, message: 'Client not found.' };
  }

  if (!(await isEmailUnique(clientData.email, clientId))) {
    return { success: false, message: 'This email address is already in use by another client.' };
  }

  try {
    const updatedClientData = {
      ...clientData,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(clientRef, updatedClientData);
    return { success: true, message: 'Client updated successfully!', clientId };
  } catch (error: any) {
    console.error('Error updating client:', error);
    return { success: false, message: error.message || 'Failed to update client.' };
  }
}

export async function deleteClientAction(
  clientId: string,
  adminId: string
): Promise<ClientOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }
  try {
    const clientRef = doc(db, 'clients', clientId);
    await deleteDoc(clientRef);
    return { success: true, message: 'Client deleted successfully!' };
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return { success: false, message: error.message || 'Failed to delete client.' };
  }
}
