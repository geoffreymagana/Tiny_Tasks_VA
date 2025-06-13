
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
  isDisabled?: boolean; // New field for user account status
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
    if (typeof timestamp === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(timestamp)) {
      return timestamp;
    }
    if (timestamp && typeof timestamp.seconds === 'number' && typeof timestamp.nanoseconds === 'number') {
       return new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate().toISOString();
    }
    try {
        if (timestamp && typeof timestamp.toDate === 'function') { 
            return new Date().toISOString(); 
        }
        const d = new Date(timestamp);
        if (!isNaN(d.getTime())) return d.toISOString();
    } catch (e) {
        // ignore
    }
    console.warn("Unsupported timestamp format encountered in convertDbTimestamp:", timestamp);
    return null; 
};


export async function getAllClientsAction(): Promise<Client[]> {
  const allClientsMap = new Map<string, Client>();

  try {
    // 1. Fetch from 'clients' collection
    const clientsRef = collection(db, 'clients');
    const clientsQuery = query(clientsRef);
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
        isDisabled: data.isDisabled || false, // Assuming 'clients' can also be disabled, though less common
      };
      if (clientRecord.email) {
        allClientsMap.set(clientRecord.email, clientRecord);
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
        existingClientRecord.name = data.displayName || data.email?.split('@')[0] || existingClientRecord.name;
        existingClientRecord.createdAt = convertDbTimestamp(data.createdAt) || existingClientRecord.createdAt;
        existingClientRecord.updatedAt = convertDbTimestamp(data.updatedAt) || convertDbTimestamp(data.createdAt) || existingClientRecord.updatedAt;
        existingClientRecord.isDisabled = data.isDisabled === undefined ? false : data.isDisabled; // Prioritize user's isDisabled status
        // Keep company/phone from 'clients' record if they exist
      } else if (userEmail && !existingClientRecord) {
        allClientsMap.set(userEmail, {
          id: doc.id, // User UID
          name: data.displayName || data.email?.split('@')[0] || 'N/A',
          email: userEmail,
          company: '', 
          phone: '',   
          createdAt: convertDbTimestamp(data.createdAt),
          updatedAt: convertDbTimestamp(data.updatedAt) || convertDbTimestamp(data.createdAt),
          source: 'users',
          isDisabled: data.isDisabled === undefined ? false : data.isDisabled,
        });
      }
    });

    let combinedClients = Array.from(allClientsMap.values());

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

export async function getClientAction(clientId: string): Promise<Client | null> {
  try {
    const clientDocRef = doc(db, 'clients', clientId); 
    const clientDocSnap = await getDoc(clientDocRef);

    if (!clientDocSnap.exists()) {
      // Could also check users collection if ID might be a UID, but for now assuming it's for 'clients'
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
      source: 'clients', 
      isDisabled: data.isDisabled || false,
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
  clientId: string, 
  adminId: string
): Promise<ClientOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }
  try {
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


export async function toggleUserAccountDisabledStatusAction(
  userId: string, // This will be the UID from Firebase Auth / users collection
  adminId: string
): Promise<ClientOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges to change account status.' };
  }

  const userDocRef = doc(db, 'users', userId);
  try {
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      return { success: false, message: 'User account not found.' };
    }

    const userData = userDocSnap.data();
    const currentDisabledStatus = userData.isDisabled === undefined ? false : userData.isDisabled;
    const newDisabledStatus = !currentDisabledStatus;

    await updateDoc(userDocRef, {
      isDisabled: newDisabledStatus,
      updatedAt: serverTimestamp(),
    });

    return { 
      success: true, 
      message: `User account has been ${newDisabledStatus ? 'disabled' : 'enabled'} successfully.` 
    };
  } catch (error: any) {
    console.error('Error toggling user account status:', error);
    return { success: false, message: error.message || 'Failed to toggle user account status.' };
  }
}

    