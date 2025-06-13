
'use server';

import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, updateDoc, deleteDoc, query, where, Timestamp, writeBatch } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase'; // Added functions
import { httpsCallable } from 'firebase/functions'; // For calling Cloud Functions
import { z } from 'zod';

// Department Configuration
export const STAFF_DEPARTMENTS_CONFIG: Record<string, { name: string; color: string; textColor?: string }> = {
  'Client Success & Onboarding': { name: 'Client Success & Onboarding', color: 'hsl(207, 70%, 50%)', textColor: 'hsl(0, 0%, 100%)' }, // Blue
  'VA Operations': { name: 'VA Operations', color: 'hsl(145, 63%, 42%)', textColor: 'hsl(0, 0%, 100%)' }, // Green
  'Sales & Account Management': { name: 'Sales & Account Management', color: 'hsl(30, 90%, 50%)', textColor: 'hsl(0, 0%, 100%)' }, // Orange
  'HR / VA Talent': { name: 'HR / VA Talent', color: 'hsl(260, 60%, 55%)', textColor: 'hsl(0, 0%, 100%)' }, // Purple
  'Automation & AI': { name: 'Automation & AI', color: 'hsl(180, 50%, 45%)', textColor: 'hsl(0, 0%, 100%)' }, // Teal
  'Marketing & Content': { name: 'Marketing & Content', color: 'hsl(330, 70%, 55%)', textColor: 'hsl(0, 0%, 100%)' }, // Pink
  'IT Support': { name: 'IT Support', color: 'hsl(0, 0%, 40%)', textColor: 'hsl(0, 0%, 100%)' }, // Gray
  'Finance & Billing': { name: 'Finance & Billing', color: 'hsl(45, 100%, 50%)', textColor: 'hsl(210, 29%, 10%)' }, // Yellow (darker text)
  'QA & Training': { name: 'QA & Training', color: 'hsl(240, 60%, 65%)', textColor: 'hsl(0, 0%, 100%)' }, // Indigo
  'Product/UX': { name: 'Product/UX', color: 'hsl(350, 75%, 60%)', textColor: 'hsl(0, 0%, 100%)' }, // Red-Pink
};
export const STAFF_DEPARTMENT_NAMES = Object.keys(STAFF_DEPARTMENTS_CONFIG);

const defaultStaffPassword = "password123"; // Default password for new staff

const staffFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().email("Invalid email address.").max(100),
  department: z.enum(STAFF_DEPARTMENT_NAMES as [string, ...string[]], {
    errorMap: () => ({ message: "Please select a valid department." }),
  }),
  phone: z.string().max(20).optional().or(z.literal('')),
});
export type StaffFormData = z.infer<typeof staffFormSchema>;

export interface StaffMember extends StaffFormData {
  id: string;
  authUid?: string | null; // UID from Firebase Auth
  createdAt: string | null;
  updatedAt: string | null;
  isDisabled?: boolean; // From the users collection
}

export interface StaffOperationResult {
  success: boolean;
  message: string;
  staffId?: string;
  authUid?: string;
}

async function verifyAdmin(adminId: string): Promise<boolean> {
  if (!adminId) return false;
  const adminDocRef = doc(db, 'users', adminId);
  const adminDoc = await getDoc(adminDocRef);
  return adminDoc.exists() && adminDoc.data()?.role === 'admin';
}

async function isStaffEmailUnique(email: string, collectionName: 'staff' | 'users', currentId?: string): Promise<boolean> {
  const q = query(collection(db, collectionName), where('email', '==', email));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return true;
  if (currentId && querySnapshot.docs[0].id === currentId) return true; // For updates, allow same email for current doc
  if (collectionName === 'users' && currentId && querySnapshot.docs.some(d => d.id === currentId)) return true; // For users collection, ID is authUid
  return false;
}

export async function addStaffAction(
  formData: StaffFormData,
  adminId: string
): Promise<StaffOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  if (!(await isStaffEmailUnique(formData.email, 'users'))) {
    return { success: false, message: 'This email address is already in use by an existing user account.' };
  }
   if (!(await isStaffEmailUnique(formData.email, 'staff'))) {
    return { success: false, message: 'This email address is already in use by an existing staff record.' };
  }

  try {
    const createStaffAuthUser = httpsCallable(functions, 'createStaffAuthUser');
    const authResult: any = await createStaffAuthUser({
      email: formData.email,
      password: defaultStaffPassword, // Consider making this configurable or more secure
      displayName: formData.name,
      department: formData.department,
    });

    if (!authResult.data.success || !authResult.data.uid) {
      throw new Error(authResult.data.message || 'Failed to create Firebase Auth user.');
    }
    const authUid = authResult.data.uid;

    const newStaffDocRef = doc(collection(db, 'staff'));
    await setDoc(newStaffDocRef, {
      ...formData,
      authUid: authUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, message: 'Staff member added, Auth account created successfully!', staffId: newStaffDocRef.id, authUid: authUid };
  } catch (error: any) {
    console.error('Error adding staff member:', error);
    // Potentially try to clean up Auth user if Firestore part fails
    return { success: false, message: `Failed to add staff member: ${error.message}` };
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
            return new Date().toISOString(); // Fallback for pending server timestamps
        }
        const d = new Date(timestamp);
        if (!isNaN(d.getTime())) return d.toISOString();
    } catch (e) {
        // ignore
    }
    console.warn("Unsupported timestamp format encountered in convertDbTimestamp for staff:", timestamp);
    return null;
};

export async function getAllStaffAction(): Promise<StaffMember[]> {
  try {
    const staffCollectionRef = collection(db, 'staff');
    const staffQuery = query(staffCollectionRef, orderBy('createdAt', 'desc'));
    const staffSnapshot = await getDocs(staffQuery);
    
    const staffList: StaffMember[] = [];

    for (const staffDoc of staffSnapshot.docs) {
      const staffData = staffDoc.data();
      let isDisabled = false; // Default
      
      // Try to fetch corresponding user document for isDisabled status
      if (staffData.authUid) {
        const userDocRef = doc(db, 'users', staffData.authUid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          isDisabled = userDocSnap.data()?.isDisabled || false;
        }
      } else if (staffData.email) { // Fallback to email if authUid is missing (older records)
        const usersQuery = query(collection(db, 'users'), where('email', '==', staffData.email), where('role', '==', 'staff'));
        const usersSnapshot = await getDocs(usersQuery);
        if (!usersSnapshot.empty) {
          isDisabled = usersSnapshot.docs[0].data()?.isDisabled || false;
        }
      }

      staffList.push({
        id: staffDoc.id,
        name: staffData.name || '',
        email: staffData.email || '',
        department: staffData.department || STAFF_DEPARTMENT_NAMES[0], // Default if missing
        phone: staffData.phone || '',
        authUid: staffData.authUid || null,
        createdAt: convertDbTimestamp(staffData.createdAt),
        updatedAt: convertDbTimestamp(staffData.updatedAt),
        isDisabled: isDisabled,
      });
    }
    return staffList;
  } catch (error) {
    console.error("Error fetching all staff:", error);
    return [];
  }
}

export async function getStaffAction(staffId: string): Promise<StaffMember | null> {
  try {
    const staffDocRef = doc(db, 'staff', staffId);
    const staffDocSnap = await getDoc(staffDocRef);

    if (!staffDocSnap.exists()) {
      return null;
    }
    const data = staffDocSnap.data();
     let isDisabled = false;
    if (data.authUid) {
      const userDocRef = doc(db, 'users', data.authUid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        isDisabled = userDocSnap.data()?.isDisabled || false;
      }
    }

    return {
      id: staffDocSnap.id,
      name: data.name || '',
      email: data.email || '',
      department: data.department || STAFF_DEPARTMENT_NAMES[0],
      phone: data.phone || '',
      authUid: data.authUid || null,
      createdAt: convertDbTimestamp(data.createdAt),
      updatedAt: convertDbTimestamp(data.updatedAt),
      isDisabled: isDisabled,
    };
  } catch (error) {
    console.error("Error fetching staff member:", error);
    return null;
  }
}

export async function updateStaffAction(
  staffId: string,
  formData: StaffFormData,
  adminId: string
): Promise<StaffOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  const staffRef = doc(db, 'staff', staffId);
  const staffSnap = await getDoc(staffRef);
  if (!staffSnap.exists()) {
    return { success: false, message: 'Staff member not found.' };
  }
  const existingStaffData = staffSnap.data();

  // Email updates require checking uniqueness in 'users' and handling Auth user email change if implemented.
  // For simplicity, if email changed, we are only updating Firestore. Auth email change is complex.
  if (formData.email !== existingStaffData.email) {
     if (!(await isStaffEmailUnique(formData.email, 'users', existingStaffData.authUid))) {
        return { success: false, message: 'This email address is already in use by another user account.' };
    }
     if (!(await isStaffEmailUnique(formData.email, 'staff', staffId))) {
        return { success: false, message: 'This email address is already in use by another staff record.' };
    }
  }

  try {
    const batch = writeBatch(db);
    
    batch.update(staffRef, {
      ...formData,
      updatedAt: serverTimestamp(),
    });

    // Update corresponding user document if authUid exists
    if (existingStaffData.authUid) {
      const userRef = doc(db, 'users', existingStaffData.authUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
          const userUpdateData: any = {
            displayName: formData.name,
            department: formData.department,
            email: formData.email, // Keep email in sync
            updatedAt: serverTimestamp(),
          };
          batch.update(userRef, userUpdateData);
      } else {
        console.warn(`User document not found for staff authUid: ${existingStaffData.authUid} during update.`);
      }
    } else {
         // Fallback: If no authUid, try to update user by current email (less reliable)
        const usersQuery = query(collection(db, 'users'), where('email', '==', existingStaffData.email), where('role', '==', 'staff'));
        const usersSnapshot = await getDocs(usersQuery);
        if (!usersSnapshot.empty) {
            const userRef = usersSnapshot.docs[0].ref;
             const userUpdateData: any = {
                displayName: formData.name,
                department: formData.department,
                email: formData.email,
                updatedAt: serverTimestamp(),
            };
            batch.update(userRef, userUpdateData);
        } else {
            console.warn(`User document not found for staff email: ${existingStaffData.email} during update (no authUid).`);
        }
    }
    
    await batch.commit();
    return { success: true, message: 'Staff member updated successfully!', staffId };
  } catch (error: any) {
    console.error('Error updating staff member:', error);
    return { success: false, message: error.message || 'Failed to update staff member.' };
  }
}

export async function deleteStaffAction(
  staffId: string,
  authUid: string | null | undefined, // authUid from the staff record
  adminId: string
): Promise<StaffOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  try {
    const staffRef = doc(db, 'staff', staffId);
    const staffSnap = await getDoc(staffRef);
    if (!staffSnap.exists()) {
        return { success: false, message: 'Staff record not found for deletion.' };
    }
    const staffData = staffSnap.data();
    const effectiveAuthUid = authUid || staffData.authUid;

    if (!effectiveAuthUid) {
      // If no authUid, we can only delete the staff record.
      // The user record in 'users' might remain if not linked by a discoverable email.
      console.warn(`No authUid found for staff ID ${staffId}. Deleting staff record only.`);
      await deleteDoc(staffRef);
      return { success: true, message: 'Staff record deleted. Corresponding Auth user/user record might need manual review if no authUid was present.' };
    }

    // Call Cloud Function to delete Auth user and users document
    const deleteStaffAuthUser = httpsCallable(functions, 'deleteStaffAuthUser');
    const authDeletionResult: any = await deleteStaffAuthUser({ uid: effectiveAuthUid });

    if (!authDeletionResult.data.success) {
      // If Auth/User deletion fails, we might choose not to delete the staff record,
      // or log the error and proceed with staff record deletion.
      // For now, let's return the error from the Cloud Function.
      throw new Error(authDeletionResult.data.message || 'Failed to delete Firebase Auth user or users document.');
    }
    
    // If Auth/User deletion was successful, delete the staff record
    await deleteDoc(staffRef);

    return { success: true, message: 'Staff member, Auth account, and user record deleted successfully!' };
  } catch (error: any) {
    console.error('Error deleting staff member:', error);
    return { success: false, message: `Failed to delete staff member: ${error.message}` };
  }
}


export async function toggleStaffAccountDisabledStatusAction(
  authUid: string, // This MUST be the authUid
  adminId: string
): Promise<StaffOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges to change account status.' };
  }

  if (!authUid) {
    return { success: false, message: 'Staff member Auth UID not provided.' };
  }

  const userDocRef = doc(db, 'users', authUid);
  try {
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      return { success: false, message: 'Staff user account not found in users collection.' };
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
      message: `Staff account has been ${newDisabledStatus ? 'disabled' : 'enabled'} successfully.`
    };
  } catch (error: any) {
    console.error('Error toggling staff account status:', error);
    return { success: false, message: error.message || 'Failed to toggle staff account status.' };
  }
}
