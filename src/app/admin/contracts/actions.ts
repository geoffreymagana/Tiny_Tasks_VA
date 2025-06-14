
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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ContractSchema, type Contract, type CreateContractFormValues, generateContractNumberSync, type ContractStatus } from './schema';
import { formatISO } from 'date-fns';

export interface ContractOperationResult {
  success: boolean;
  message: string;
  contractId?: string;
  contractNumber?: string;
}

// ----- Helper Functions -----
async function verifyAdmin(adminId: string): Promise<boolean> {
  if (!adminId) return false;
  const adminDocRef = doc(db, 'users', adminId);
  const adminDoc = await getDoc(adminDocRef);
  return adminDoc.exists() && adminDoc.data()?.role === 'admin';
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

export async function addContractAction(
  formData: Omit<CreateContractFormValues, 'effectiveDate' | 'expirationDate'> & {
    effectiveDate: string; // ISO String
    expirationDate?: string | null; // ISO String
  },
  adminId: string
): Promise<ContractOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  let clientName: string | null = null;
  if (formData.clientId) {
    const clientDocRef = doc(db, 'users', formData.clientId); // Assuming clients are in 'users' collection
    const clientDocSnap = await getDoc(clientDocRef);
    if (clientDocSnap.exists()) {
      clientName = clientDocSnap.data()?.displayName || clientDocSnap.data()?.email || null;
    } else {
      return { success: false, message: 'Selected client not found.' };
    }
  }

  try {
    const contractNumber = generateContractNumberSync();
    
    // Determine actual status, considering isTemplate
    const actualStatus: ContractStatus = formData.isTemplate ? 'template' : formData.status;

    const dataToSave: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'> = {
      ...formData,
      contractNumber,
      clientName: clientName, // Use fetched client name
      effectiveDate: formData.effectiveDate,
      expirationDate: formData.expirationDate || null,
      status: actualStatus,
      adminId,
      // isTemplate and templateName are already in formData
    };
    
    const validatedData = ContractSchema.omit({id: true, createdAt: true, updatedAt: true}).safeParse(dataToSave);
    if (!validatedData.success) {
        console.error("Server-side validation errors (addContractAction):", validatedData.error.flatten().fieldErrors);
        return { success: false, message: `Server-side validation failed: ${JSON.stringify(validatedData.error.flatten().fieldErrors)}` };
    }

    const docRef = await addDoc(collection(db, 'contracts'), {
        ...validatedData.data, 
        createdAt: serverTimestamp(), 
        updatedAt: serverTimestamp()
    });
    return { success: true, message: 'Contract created successfully!', contractId: docRef.id, contractNumber };
  } catch (error: any) {
    console.error('Error creating contract:', error);
    return { success: false, message: error.message || 'Failed to create contract.' };
  }
}

export async function getAllContractsAction(): Promise<Contract[]> {
  try {
    const contractsRef = collection(db, 'contracts');
    // Optional: Filter out templates from main list, or handle display differently
    // const q = query(contractsRef, where('isTemplate', '==', false), orderBy('effectiveDate', 'desc'));
    const q = query(contractsRef, orderBy('effectiveDate', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        effectiveDate: convertDbTimestamp(data.effectiveDate) || new Date().toISOString(),
        expirationDate: convertDbTimestamp(data.expirationDate),
        createdAt: convertDbTimestamp(data.createdAt),
        updatedAt: convertDbTimestamp(data.updatedAt),
      } as Contract;
    });
  } catch (error) {
    console.error("Error fetching all contracts:", error);
    return [];
  }
}

export async function getContractAction(contractId: string): Promise<Contract | null> {
  try {
    const contractDocRef = doc(db, 'contracts', contractId);
    const contractDocSnap = await getDoc(contractDocRef);

    if (!contractDocSnap.exists()) {
      return null;
    }
    const data = contractDocSnap.data();
    return {
      id: contractDocSnap.id,
      ...data,
      effectiveDate: convertDbTimestamp(data.effectiveDate) || new Date().toISOString(),
      expirationDate: convertDbTimestamp(data.expirationDate),
      createdAt: convertDbTimestamp(data.createdAt),
      updatedAt: convertDbTimestamp(data.updatedAt),
    } as Contract;
  } catch (error) {
    console.error(`Error fetching contract ${contractId}:`, error);
    return null;
  }
}

export async function updateContractAction(
  contractId: string,
  formData: Omit<CreateContractFormValues, 'effectiveDate' | 'expirationDate'> & {
    effectiveDate: string; // ISO String
    expirationDate?: string | null; // ISO String
  },
  adminId: string
): Promise<ContractOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  const contractRef = doc(db, 'contracts', contractId);
  try {
    const currentDocSnap = await getDoc(contractRef);
    if (!currentDocSnap.exists()) {
      return { success: false, message: 'Contract not found for update.' };
    }
    
    let clientName: string | null = null;
    if (formData.clientId) {
        const clientDocRef = doc(db, 'users', formData.clientId);
        const clientDocSnap = await getDoc(clientDocRef);
        if (clientDocSnap.exists()) {
            clientName = clientDocSnap.data()?.displayName || clientDocSnap.data()?.email || null;
        } else {
            // If client ID is provided but client not found, this might be an issue unless it's optional.
            // For now, we'll allow updating other fields even if client is not found, but clientName might become null.
            console.warn(`Client with ID ${formData.clientId} not found during contract update.`);
        }
    }

    const actualStatus: ContractStatus = formData.isTemplate ? 'template' : formData.status;

    const dataToUpdate: Partial<Contract> = {
      title: formData.title,
      clientId: formData.clientId,
      clientName: clientName,
      effectiveDate: formData.effectiveDate,
      expirationDate: formData.expirationDate || null,
      serviceDescription: formData.serviceDescription,
      termsAndConditions: formData.termsAndConditions,
      paymentTerms: formData.paymentTerms,
      status: actualStatus,
      isTemplate: formData.isTemplate,
      templateName: formData.isTemplate ? formData.templateName : null, // Only set templateName if it's a template
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(contractRef, dataToUpdate);
    return { success: true, message: 'Contract updated successfully!', contractId };
  } catch (error: any) {
    console.error(`Error updating contract ${contractId}:`, error);
    return { success: false, message: error.message || 'Failed to update contract.' };
  }
}

export async function deleteContractAction(
  contractId: string,
  adminId: string
): Promise<ContractOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }
  try {
    const contractRef = doc(db, 'contracts', contractId);
    await deleteDoc(contractRef);
    return { success: true, message: 'Contract deleted successfully!' };
  } catch (error: any) {
    console.error(`Error deleting contract ${contractId}:`, error);
    return { success: false, message: error.message || 'Failed to delete contract.' };
  }
}

// Placeholder for "send contract" - might involve email, signing service integration, etc.
export async function sendContractAction(
  contractId: string,
  adminId: string
): Promise<ContractOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  const contract = await getContractAction(contractId);
  if (!contract) {
    return { success: false, message: 'Contract not found.' };
  }

  // Simulate sending
  console.log(`Simulating sending contract ${contract.contractNumber} to ${contract.clientName || 'client'}`);
  
  let updateMessage = '';
  if (contract.status === 'draft') {
    // Convert dates back to ISO strings for the update action
    const updatePayload: Omit<CreateContractFormValues, 'effectiveDate' | 'expirationDate'> & { effectiveDate: string; expirationDate?: string | null; } = {
      title: contract.title,
      clientId: contract.clientId,
      effectiveDate: contract.effectiveDate, // Already ISO string from getContractAction
      expirationDate: contract.expirationDate, // Already ISO string or null
      serviceDescription: contract.serviceDescription,
      termsAndConditions: contract.termsAndConditions,
      paymentTerms: contract.paymentTerms,
      status: 'pending_signature', // Update status
      isTemplate: contract.isTemplate,
      templateName: contract.templateName,
    };
    const result = await updateContractAction(contractId, updatePayload, adminId);
    if (result.success) {
      updateMessage = " Status updated to 'Pending Signature'.";
    } else {
      updateMessage = ` Failed to update status: ${result.message}`;
    }
  }
  return { success: true, message: `Contract ${contract.contractNumber} marked for sending (simulation).${updateMessage}` };
}

// Action to get all contract templates
export async function getAllContractTemplatesAction(): Promise<Contract[]> {
  try {
    const contractsRef = collection(db, 'contracts');
    const q = query(contractsRef, where('isTemplate', '==', true), orderBy('templateName', 'asc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        effectiveDate: convertDbTimestamp(data.effectiveDate) || new Date().toISOString(),
        expirationDate: convertDbTimestamp(data.expirationDate),
        createdAt: convertDbTimestamp(data.createdAt),
        updatedAt: convertDbTimestamp(data.updatedAt),
      } as Contract;
    });
  } catch (error) {
    console.error("Error fetching contract templates:", error);
    return [];
  }
}
