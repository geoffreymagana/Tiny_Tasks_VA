
'use server';

import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, updateDoc, deleteDoc, query, where, Timestamp, orderBy } from 'firebase/firestore';
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
  createdAt: string | null; 
  updatedAt: string | null; 
  source: 'clients' | 'users'; // To identify the origin of the client data
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

// Helper function to check if email is unique in the 'clients' collection
async function isEmailUniqueInClientsCollection(email: string, currentClientId?: string): Promise<boolean> {
  const q = query(collection(db, 'clients'), where('email', '==', email));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return true;
  }
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

  if (!(await isEmailUniqueInClientsCollection(clientData.email))) {
    return { success: false, message: 'This email address is already in use by another client in the dedicated clients list.' };
  }
  // Note: This doesn't check against the 'users' collection here, as adding is specific to the 'clients' collection.
  // A more comprehensive check could be added if necessary.

  try {
    const newClient = {
      ...clientData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'clients'), newClient);
    return { success: true, message: 'Client added successfully to dedicated list!', clientId: docRef.id };
  } catch (error: any) {
    console.error('Error adding client:', error);
    return { success: false, message: error.message || 'Failed to add client.' };
  }
}

const convertDbTimestamp = (timestamp: any): string | null => {
    if (!timestamp) return null;
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toISOString();
    }
    // Handle cases where timestamp might already be an ISO string or a Firestore ServerTimestamp placeholder object
    if (typeof timestamp === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(timestamp)) {
      return timestamp;
    }
    if (timestamp && typeof timestamp.seconds === 'number' && typeof timestamp.nanoseconds === 'number') {
       return new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate().toISOString();
    }
    // Fallback for unexpected formats, trying to create a date if it's a recognizable date string, otherwise null
    try {
        if (timestamp && typeof timestamp.toDate === 'function') { // Handle Firestore ServerTimestamp placeholder before written
            return new Date().toISOString(); // Placeholder for current time, will be updated by server
        }
        const d = new Date(timestamp);
        if (!isNaN(d.getTime())) return d.toISOString();
    } catch (e) {
        // ignore
    }
    console.warn("Unsupported timestamp format encountered:", timestamp);
    return null; 
};


export async function getAllClientsAction(): Promise<Client[]> {
  const allClientsMap = new Map<string, Client>();

  try {
    // 1. Fetch from 'clients' collection
    const clientsRef = collection(db, 'clients');
    const clientsQuery = query(clientsRef); // Removed orderBy for now, will sort merged list later
    const clientsSnapshot = await getDocs(clientsQuery);
    
    clientsSnapshot.forEach(doc => {
      const data = doc.data();
      const clientRecord: Client = {
        id: doc.id,
        name: data.name || '',
        email: data.email || '',
        company: data.company || '',
        phone: data.phone || '',
        createdAt: convertDbTimestamp(data.createdAt),
        updatedAt: convertDbTimestamp(data.updatedAt),
        source: 'clients',
      };
      if (clientRecord.email) {
        allClientsMap.set(clientRecord.email, clientRecord); // Add or overwrite if email conflict (clients specific info)
      }
    });

    // 2. Fetch from 'users' collection where role is 'client'
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef, where('role', '==', 'client'));
    const usersSnapshot = await getDocs(usersQuery);

    usersSnapshot.forEach(doc => {
      const data = doc.data();
      const userEmail = data.email || '';

      const existingClientRecord = userEmail ? allClientsMap.get(userEmail) : undefined;

      if (existingClientRecord && existingClientRecord.source === 'clients') {
        // User exists in 'users' and was also manually added to 'clients'.
        // Update the existing record from 'clients' to indicate it's also a 'user' (for future reference)
        // and ensure user data (like name, email, createdAt from user record) takes precedence if more up-to-date.
        // For simplicity, we can just mark it or decide a priority. Let's make 'users' data primary for core fields.
        existingClientRecord.name = data.displayName || data.email?.split('@')[0] || existingClientRecord.name;
        existingClientRecord.createdAt = convertDbTimestamp(data.createdAt) || existingClientRecord.createdAt;
        existingClientRecord.updatedAt = convertDbTimestamp(data.updatedAt) || convertDbTimestamp(data.createdAt) || existingClientRecord.updatedAt;
        // Keep company/phone from 'clients' record if they exist
      } else if (userEmail && !existingClientRecord) {
        // New client from 'users' collection not in 'clients' map yet
        allClientsMap.set(userEmail, {
          id: doc.id, // User UID
          name: data.displayName || data.email?.split('@')[0] || 'N/A',
          email: userEmail,
          company: '', // Not typically in 'users' collection
          phone: '',   // Not typically in 'users' collection
          createdAt: convertDbTimestamp(data.createdAt),
          updatedAt: convertDbTimestamp(data.updatedAt) || convertDbTimestamp(data.createdAt),
          source: 'users',
        });
      }
    });

    let combinedClients = Array.from(allClientsMap.values());

    // Sort by createdAt descending (most recent first)
    combinedClients.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    
    return combinedClients;

  } catch (error) {
    console.error("Error fetching all clients in getAllClientsAction:", error);
    return [];
  }
}

// getClientAction, updateClientAction, deleteClientAction primarily operate on the 'clients' collection.
// The ID passed to them will be from the `clients` collection if edit/delete is initiated from UI.
export async function getClientAction(clientId: string): Promise<Client | null> {
  try {
    const clientDocRef = doc(db, 'clients', clientId); // Assumes ID is for 'clients' collection
    const clientDocSnap = await getDoc(clientDocRef);

    if (!clientDocSnap.exists()) {
      return null;
    }
    const data = clientDocSnap.data();
    return {
      id: clientDocSnap.id,
      name: data.name || '',
      email: data.email || '',
      company: data.company || '',
      phone: data.phone || '',
      createdAt: convertDbTimestamp(data.createdAt),
      updatedAt: convertDbTimestamp(data.updatedAt),
      source: 'clients', // This specific action fetches from 'clients'
    };
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

  // This operation is intended for records in the 'clients' collection
  const clientRef = doc(db, 'clients', clientId);
  const clientSnap = await getDoc(clientRef);
  if (!clientSnap.exists()) {
    return { success: false, message: 'Client record not found in dedicated list.' };
  }

  if (!(await isEmailUniqueInClientsCollection(clientData.email, clientId))) {
    return { success: false, message: 'This email address is already in use by another client in the dedicated list.' };
  }

  try {
    const updatedClientData = {
      ...clientData,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(clientRef, updatedClientData);
    return { success: true, message: 'Client updated successfully in dedicated list!', clientId };
  } catch (error: any) {
    console.error('Error updating client:', error);
    return { success: false, message: error.message || 'Failed to update client.' };
  }
}

export async function deleteClientAction(
  clientId: string, // Assumes ID is for 'clients' collection
  adminId: string
): Promise<ClientOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }
  try {
    // This operation is intended for records in the 'clients' collection
    const clientRef = doc(db, 'clients', clientId);
    const clientSnap = await getDoc(clientRef);
    if (!clientSnap.exists()) {
      return { success: false, message: 'Client record not found in dedicated list for deletion.' };
    }
    await deleteDoc(clientRef);
    return { success: true, message: 'Client deleted successfully from dedicated list!' };
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return { success: false, message: error.message || 'Failed to delete client.' };
  }
}
