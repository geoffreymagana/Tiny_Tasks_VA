
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
  let finalClientId: string | null = formData.clientId || null;
  let finalStatus: ContractStatus = formData.status;
  let finalTemplateName: string | null = formData.templateName || null;

  if (formData.isTemplate) {
    finalStatus = 'template';
    finalClientId = null; // Templates are not tied to specific clients
    // templateName is already set from formData or will be null if empty
  } else {
    finalTemplateName = null; // Not a template, so no template name
    if (finalClientId) {
      const clientDocRef = doc(db, 'users', finalClientId); // Assuming clients are in 'users' collection with role 'client'
      const clientDocSnap = await getDoc(clientDocRef);
      if (clientDocSnap.exists() && clientDocSnap.data()?.role === 'client') {
        clientName = clientDocSnap.data()?.displayName || clientDocSnap.data()?.email || null;
      } else {
        // If client ID is provided but client not found or not a client, this is an issue for non-templates.
        return { success: false, message: 'Selected client not found or is not a valid client.' };
      }
    } else {
      // For non-templates, clientId might be considered mandatory depending on business rules.
      // Current schema allows clientId to be optional/nullable. If required for non-templates, add validation here.
      // For now, we proceed, clientName will be null.
    }
  }

  try {
    const contractNumber = generateContractNumberSync();
    
    const dataToSave: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'> = {
      title: formData.title,
      contractNumber,
      clientId: finalClientId,
      clientName: clientName,
      effectiveDate: formData.effectiveDate,
      expirationDate: formData.expirationDate || null,
      serviceDescription: formData.serviceDescription,
      termsAndConditions: formData.termsAndConditions,
      paymentTerms: formData.paymentTerms || null,
      status: finalStatus,
      isTemplate: formData.isTemplate,
      templateName: finalTemplateName,
      adminId,
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
    return { success: true, message: formData.isTemplate ? 'Contract template created successfully!' : 'Contract created successfully!', contractId: docRef.id, contractNumber };
  } catch (error: any) {
    console.error('Error creating contract:', error);
    return { success: false, message: error.message || 'Failed to create contract.' };
  }
}

export async function getAllContractsAction(): Promise<Contract[]> {
  try {
    const contractsRef = collection(db, 'contracts');
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
    let finalClientId: string | null = formData.clientId || null;
    let finalStatus: ContractStatus = formData.status;
    let finalTemplateName: string | null = formData.templateName || null;

    if (formData.isTemplate) {
        finalStatus = 'template';
        finalClientId = null;
    } else {
        finalTemplateName = null;
        if (finalClientId) {
            const clientDocRef = doc(db, 'users', finalClientId);
            const clientDocSnap = await getDoc(clientDocRef);
            if (clientDocSnap.exists() && clientDocSnap.data()?.role === 'client') {
                clientName = clientDocSnap.data()?.displayName || clientDocSnap.data()?.email || null;
            } else {
                 return { success: false, message: 'Selected client not found or is not a valid client for update.' };
            }
        }
    }


    const dataToUpdate: Partial<Contract> = {
      title: formData.title,
      clientId: finalClientId,
      clientName: clientName,
      effectiveDate: formData.effectiveDate,
      expirationDate: formData.expirationDate || null,
      serviceDescription: formData.serviceDescription,
      termsAndConditions: formData.termsAndConditions,
      paymentTerms: formData.paymentTerms || null,
      status: finalStatus,
      isTemplate: formData.isTemplate,
      templateName: finalTemplateName,
      // adminId is not updated, contractNumber is not updated
      updatedAt: serverTimestamp(),
    };
    
    // Optionally, re-validate the shape before updating, though Firestore rules should also handle consistency.
    // const validatedUpdateData = ContractSchema.partial().safeParse(dataToUpdate);
    // if (!validatedUpdateData.success) { ... }

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
  if (contract.isTemplate) {
    return { success: false, message: 'Cannot send a template directly. Create a contract from this template first.' };
  }


  console.log(`Simulating sending contract ${contract.contractNumber} to ${contract.clientName || 'client'}`);
  
  let updateMessage = '';
  // Update status to 'pending_signature' if it's currently 'draft'
  if (contract.status === 'draft') {
    const updatePayload: Omit<CreateContractFormValues, 'effectiveDate' | 'expirationDate'> & { effectiveDate: string; expirationDate?: string | null; } = {
      title: contract.title,
      clientId: contract.clientId,
      // clientName is handled by updateContractAction
      effectiveDate: contract.effectiveDate, 
      expirationDate: contract.expirationDate, 
      serviceDescription: contract.serviceDescription,
      termsAndConditions: contract.termsAndConditions,
      paymentTerms: contract.paymentTerms,
      status: 'pending_signature', // Update status
      isTemplate: contract.isTemplate, // Should be false
      templateName: contract.templateName, // Should be null
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
