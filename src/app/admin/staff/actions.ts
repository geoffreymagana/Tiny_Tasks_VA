
'use server';

import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, updateDoc, deleteDoc, query, where, Timestamp, writeBatch, setDoc } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { z } from 'zod';

// Constants STAFF_DEPARTMENTS_CONFIG and STAFF_DEPARTMENT_NAMES moved to respective page components

const defaultStaffPassword = "password123";

// Updated Zod schema: department is now a simple string.
// Validation of specific department names will primarily occur via the Select component in forms.
const staffFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().email("Invalid email address.").max(100),
  department: z.string().min(1, "Department is required."), // Ensures a department is selected
  phone: z.string().max(20).optional().or(z.literal('')),
});
export type StaffFormData = z.infer<typeof staffFormSchema>;

export interface StaffMember extends StaffFormData {
  id: string;
  authUid?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  isDisabled?: boolean;
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
  if (currentId && querySnapshot.docs[0].id === currentId) return true;
  if (collectionName === 'users' && currentId && querySnapshot.docs.some(d => d.id === currentId)) return true;
  return false;
}

export async function addStaffAction(
  formData: StaffFormData,
  adminId: string
): Promise<StaffOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  // Email uniqueness check against 'users' (Auth-linked) is crucial
  if (!(await isStaffEmailUnique(formData.email, 'users'))) {
    return { success: false, message: 'This email address is already in use by an existing user account.' };
  }
  // Also check against 'staff' collection for local records if needed, though Auth check is primary
  if (!(await isStaffEmailUnique(formData.email, 'staff'))) {
     return { success: false, message: 'This email address is already in use by an existing staff record (manual entry). Consider updating that record or using a different email.' };
  }


  try {
    const createStaffAuthUser = httpsCallable(functions, 'createStaffAuthUser');
    const authResult: any = await createStaffAuthUser({
      email: formData.email,
      password: defaultStaffPassword,
      displayName: formData.name,
      department: formData.department,
    });

    if (!authResult.data.success || !authResult.data.uid) {
      throw new Error(authResult.data.message || 'Failed to create Firebase Auth user.');
    }
    const authUid = authResult.data.uid;

    // Now that Auth user and /users entry are created by function, just create /staff entry
    const newStaffDocRef = doc(collection(db, 'staff')); // Auto-generate ID
    await setDoc(newStaffDocRef, {
      ...formData, // name, email, department, phone
      authUid: authUid, // Link to the Auth user
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // isDisabled is managed in the /users collection by the cloud function
    });

    return { success: true, message: 'Staff member added, Auth account created successfully!', staffId: newStaffDocRef.id, authUid };
  } catch (error: any) {
    console.error('Error adding staff member:', error);
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
            return new Date().toISOString(); 
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
      let isDisabled = false; 
      let departmentFromUser = staffData.department; // Default to staff record department
      
      if (staffData.authUid) {
        const userDocRef = doc(db, 'users', staffData.authUid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          isDisabled = userData?.isDisabled || false;
          departmentFromUser = userData?.department || staffData.department; // Prefer user record department
        }
      } else if (staffData.email) { 
        const usersQuery = query(collection(db, 'users'), where('email', '==', staffData.email), where('role', '==', 'staff'));
        const usersSnapshot = await getDocs(usersQuery);
        if (!usersSnapshot.empty) {
          const userData = usersSnapshot.docs[0].data();
          isDisabled = userData?.isDisabled || false;
          departmentFromUser = userData?.department || staffData.department;
        }
      }

      staffList.push({
        id: staffDoc.id,
        name: staffData.name || '',
        email: staffData.email || '',
        department: departmentFromUser, 
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
    let departmentFromUser = data.department;

    if (data.authUid) {
      const userDocRef = doc(db, 'users', data.authUid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        isDisabled = userData?.isDisabled || false;
        departmentFromUser = userData?.department || data.department;
      }
    }

    return {
      id: staffDocSnap.id,
      name: data.name || '',
      email: data.email || '',
      department: departmentFromUser,
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
  formData: StaffFormData, // email is part of formData but should be read-only in the form
  adminId: string
): Promise<StaffOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  const staffRef = doc(db, 'staff', staffId);
  const staffSnap = await getDoc(staffRef);
  if (!staffSnap.exists()) {
    return { success: false, message: 'Staff member not found in "staff" collection.' };
  }
  const existingStaffData = staffSnap.data();
  
  // Email is not expected to change via this form.
  // If it were, we'd need to check uniqueness and call an Auth update function.
  // For this implementation, we assume email from formData matches existingStaffData.email.

  try {
    const batch = writeBatch(db);
    
    // Update staff collection document
    batch.update(staffRef, {
      name: formData.name,
      department: formData.department,
      phone: formData.phone,
      // email: formData.email, // Email is not being updated here to keep it simple
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
            // email: formData.email, // If email were to change, it should be updated via Auth function
            updatedAt: serverTimestamp(),
          };
          batch.update(userRef, userUpdateData);
      } else {
        console.warn(`User document not found for staff authUid: ${existingStaffData.authUid} during update.`);
      }
    } else {
        const usersQuery = query(collection(db, 'users'), where('email', '==', existingStaffData.email), where('role', '==', 'staff'));
        const usersSnapshot = await getDocs(usersQuery);
        if (!usersSnapshot.empty) {
            const userRef = usersSnapshot.docs[0].ref;
             const userUpdateData: any = {
                displayName: formData.name,
                department: formData.department,
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
  authUid: string | null | undefined,
  adminId: string
): Promise<StaffOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  const staffRef = doc(db, 'staff', staffId);
  const staffSnap = await getDoc(staffRef);
  if (!staffSnap.exists()) {
      return { success: false, message: 'Staff record not found for deletion.' };
  }
  const staffData = staffSnap.data();
  const effectiveAuthUid = authUid || staffData.authUid; // Use authUid from parameter if available, else from staff record

  if (!effectiveAuthUid) {
    // Critical: If no authUid, we can't reliably delete the Auth user or their /users doc.
    // This case should ideally not happen if addStaffAction always ensures an authUid.
    // As a fallback, delete only the staff record.
    await deleteDoc(staffRef);
    return { success: true, message: 'Staff record deleted. Corresponding Auth user/user record might need manual review as no authUid was linked.' };
  }

  try {
    const deleteStaffAuthUser = httpsCallable(functions, 'deleteStaffAuthUser');
    const authDeletionResult: any = await deleteStaffAuthUser({ uid: effectiveAuthUid });

    if (!authDeletionResult.data.success) {
      throw new Error(authDeletionResult.data.message || 'Cloud Function failed to delete Firebase Auth user or users document.');
    }
    
    // If Auth/User deletion was successful, delete the staff record from /staff collection
    await deleteDoc(staffRef);

    return { success: true, message: 'Staff member, Auth account, and user record deleted successfully!' };
  } catch (error: any) {
    console.error('Error deleting staff member:', error);
    return { success: false, message: `Failed to delete staff member: ${error.message}` };
  }
}


export async function toggleStaffAccountDisabledStatusAction(
  authUid: string,
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

    