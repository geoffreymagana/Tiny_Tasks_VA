
'use server';

import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, updateDoc, deleteDoc, query, where, Timestamp, writeBatch, setDoc, orderBy } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { z } from 'zod';

// Default password for new staff members created via Cloud Function
const defaultStaffPassword = "password123"; // Changed from "12345678" to "password123" as per Cloud Function setup

// Zod schema for staff form data validation (department validation handled by Select component)
const staffFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().email("Invalid email address.").max(100),
  department: z.string().min(1, "Department is required."), 
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

// Email uniqueness check specific to the 'staff' collection for its own records
async function isEmailUniqueInStaffCollection(email: string, currentStaffId?: string): Promise<boolean> {
  const q = query(collection(db, 'staff'), where('email', '==', email));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return true;
  if (currentStaffId && querySnapshot.docs[0].id === currentStaffId) return true; // Allow email if it belongs to the current staff being updated
  return false;
}


export async function addStaffAction(
  formData: StaffFormData,
  adminId: string
): Promise<StaffOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  // Check if email is already in use in the local 'staff' collection first
  // (Cloud Function will handle uniqueness for Auth and 'users' collection)
  if (!(await isEmailUniqueInStaffCollection(formData.email))) {
     return { success: false, message: 'This email address is already in use by an existing staff record in the local staff list.' };
  }

  try {
    const createStaffAuthUserCallable = httpsCallable(functions, 'createStaffAuthUser');
    
    // Call the cloud function to create Auth user and /users entry
    const authResult = await createStaffAuthUserCallable({
      email: formData.email,
      password: defaultStaffPassword,
      displayName: formData.name,
      department: formData.department,
    }) as { data: { success: boolean; uid?: string; message?: string } };

    if (!authResult.data.success || !authResult.data.uid) {
      throw new Error(authResult.data.message || 'Cloud Function "createStaffAuthUser" did not return success or UID.');
    }
    const authUid = authResult.data.uid;

    // If Auth user and /users entry created successfully by function,
    // then create the /staff collection entry
    const newStaffDocRef = doc(collection(db, 'staff'));
    await setDoc(newStaffDocRef, {
      ...formData, // name, email, department, phone
      authUid: authUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // isDisabled status is primarily managed in the /users collection by the Cloud Function & toggle action
    });

    return { 
        success: true, 
        message: 'Staff member added: Auth account and user record created successfully via Cloud Function. Local staff record also created.', 
        staffId: newStaffDocRef.id, 
        authUid 
    };
  } catch (error: any) {
    console.error('Full error details in addStaffAction:', error); // Log the full error object
    let detailedMessage = 'Failed to add staff member.';
    if (error.code === 'functions/not-found' || error.code === 'not-found' || (error.message && error.message.toLowerCase().includes("not found"))) {
        detailedMessage = 'Failed to add staff member: The "createStaffAuthUser" Cloud Function was not found. Please ensure it is correctly deployed and the name matches.';
    } else if (error.message) {
        detailedMessage = `Failed to add staff member: ${error.message}`;
    }
    return { success: false, message: detailedMessage };
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
        if (timestamp && typeof timestamp.toDate === 'function') { // Handle Firestore ServerTimestamp placeholder for client-side rendering
            return new Date().toISOString(); // Fallback or indicate pending
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
      let departmentFromUser = staffData.department;
      
      // Prefer isDisabled and department from the linked /users document if authUid exists
      if (staffData.authUid) {
        const userDocRef = doc(db, 'users', staffData.authUid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          isDisabled = userData?.isDisabled === undefined ? false : userData.isDisabled; // Default to false if undefined
          departmentFromUser = userData?.department || staffData.department; // Prefer user record department
        } else {
          console.warn(`User document not found for staff authUid: ${staffData.authUid}. Using staff record data for status/department.`);
        }
      } else {
         // Fallback for older staff records that might not have authUid directly on staff doc,
         // but for new entries, authUid should always be present.
         console.warn(`Staff record ${staffDoc.id} is missing authUid. Status and department might not be fully synced with user account.`);
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
        isDisabled = userData?.isDisabled === undefined ? false : userData.isDisabled;
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
  formData: StaffFormData,
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

  // Email should not change via this form; if it did, Auth would need update via CF
  if (formData.email !== existingStaffData.email) {
      return { success: false, message: "Email address cannot be changed through this form."};
  }
  
  // Check for email uniqueness if it were to change, but it's read-only in form.
  // If it becomes editable, this check for the staff collection itself (excluding current staff) is needed.
  // if (formData.email !== existingStaffData.email && !(await isEmailUniqueInStaffCollection(formData.email, staffId))) {
  //   return { success: false, message: 'This email address is already in use by another staff record in the local list.' };
  // }


  try {
    const batch = writeBatch(db);
    
    // Update staff collection document
    batch.update(staffRef, {
      name: formData.name,
      department: formData.department,
      phone: formData.phone,
      // email: formData.email, // Not updating email to keep it simple.
      updatedAt: serverTimestamp(),
    });

    // Update corresponding user document if authUid exists
    if (existingStaffData.authUid) {
      const userRef = doc(db, 'users', existingStaffData.authUid);
      const userSnap = await getDoc(userRef); // Check if user doc actually exists
      if (userSnap.exists()) {
          const userUpdateData: any = {
            displayName: formData.name,
            department: formData.department,
            // email: formData.email, // If email were to change, it should be updated via Auth function
            updatedAt: serverTimestamp(),
          };
          batch.update(userRef, userUpdateData);
      } else {
        // This case is problematic: staff record has authUid but no corresponding user record.
        // Could create it, or log a warning. For now, log.
        console.warn(`User document not found for staff authUid: ${existingStaffData.authUid} during update. Only local staff record updated.`);
      }
    } else {
        // Attempt to find user by email if no authUid on staff record (legacy or issue)
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
            console.warn(`User document not found for staff email: ${existingStaffData.email} during update (no authUid). Only local staff record updated.`);
        }
    }
    
    await batch.commit();
    return { success: true, message: 'Staff member details updated successfully!', staffId };
  } catch (error: any) {
    console.error('Error updating staff member:', error);
    return { success: false, message: error.message || 'Failed to update staff member.' };
  }
}

export async function deleteStaffAction(
  staffId: string,
  authUid: string | null | undefined, // authUid is from the staff member object passed from frontend
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
  // Prefer authUid passed from client (which should be from the staff object), fallback to record's authUid
  const effectiveAuthUid = authUid || staffData.authUid; 

  if (!effectiveAuthUid) {
    // If no authUid, we can't call the Cloud Function to delete Auth user or /users doc.
    // Fallback: delete only the /staff record. This is not ideal for data consistency.
    await deleteDoc(staffRef);
    console.warn(`Staff record ${staffId} deleted, but no authUid was found. Corresponding Auth user/user record might need manual review/deletion.`);
    return { success: true, message: 'Local staff record deleted. Linked Auth user/user record could not be automatically processed due to missing authUid.' };
  }

  try {
    const deleteStaffAuthUserCallable = httpsCallable(functions, 'deleteStaffAuthUser');
    const authDeletionResult = await deleteStaffAuthUserCallable({ uid: effectiveAuthUid }) as { data: { success: boolean; message?: string } };

    if (!authDeletionResult.data.success) {
      // If CF returns success:false, use its message.
      throw new Error(authDeletionResult.data.message || 'Cloud Function "deleteStaffAuthUser" failed to delete user.');
    }
    
    // If Auth/User deletion was successful via Cloud Function, then delete the /staff record
    await deleteDoc(staffRef);

    return { success: true, message: 'Staff member, their Auth account, and user record were deleted successfully via Cloud Function. Local staff record also removed.' };
  } catch (error: any) {
    console.error('Full error details in deleteStaffAction:', error);
    let detailedMessage = 'Failed to delete staff member.';
     if (error.code === 'functions/not-found' || error.code === 'not-found' || (error.message && error.message.toLowerCase().includes("not found"))) {
        detailedMessage = 'Failed to delete staff member: The "deleteStaffAuthUser" Cloud Function was not found. Please ensure it is correctly deployed and the name matches.';
    } else if (error.message) {
        detailedMessage = `Failed to delete staff member: ${error.message}`;
    }
    // If the Cloud Function fails but the staff record still exists, we don't delete the staff record here
    // to avoid partial deletion if the main issue was with Auth/user deletion.
    return { success: false, message: detailedMessage };
  }
}


export async function toggleStaffAccountDisabledStatusAction(
  authUid: string, // This should always be the authUid of the staff member
  adminId: string
): Promise<StaffOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges to change account status.' };
  }

  if (!authUid) {
    return { success: false, message: 'Staff member Auth UID not provided. Cannot toggle status.' };
  }

  const userDocRef = doc(db, 'users', authUid);
  try {
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      return { success: false, message: 'Staff user account not found in users collection. Cannot toggle status.' };
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
