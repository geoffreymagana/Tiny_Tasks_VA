
'use server';

import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, updateDoc, deleteDoc, query, where, Timestamp, writeBatch, setDoc, orderBy } from 'firebase/firestore';
import { db, functions, auth as firebaseAuthClient } from '@/lib/firebase'; // Added firebaseAuthClient for direct auth operations
import { httpsCallable } from 'firebase/functions';
import { z } from 'zod';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

// Zod schema for staff form data validation (department validation handled by Select component)
const staffFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().email("Invalid email address.").max(100),
  department: z.string().min(1, "Department is required."), 
  phone: z.string().max(20).optional().or(z.literal('')),
});
export type StaffFormData = z.infer<typeof staffFormSchema>;

// Extended form data for creation action to include password and invite flag
export interface CreateStaffActionData extends StaffFormData {
  passwordForNewUser: string;
  sendInviteEmail?: boolean;
}


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

async function isEmailUniqueInStaffCollection(email: string, currentStaffId?: string): Promise<boolean> {
  const q = query(collection(db, 'staff'), where('email', '==', email));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return true;
  if (currentStaffId && querySnapshot.docs[0].id === currentStaffId) return true;
  return false;
}


export async function addStaffAction(
  formData: CreateStaffActionData,
  adminId: string
): Promise<StaffOperationResult> {
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  if (!(await isEmailUniqueInStaffCollection(formData.email))) {
     return { success: false, message: 'This email address is already in use by an existing staff record.' };
  }

  try {
    // 1. Create Firebase Auth user directly - This part is tricky in a Server Action
    // Firebase Admin SDK should be used for this, typically in a Cloud Function
    // or a backend environment. Client SDK createUserWithEmailAndPassword cannot
    // be directly used in a Server Action without re-authenticating or complex setup.
    // FOR SIMULATION: We will assume the Cloud Function approach is still preferred for security,
    // and the Cloud Function is adapted to optionally send the email.
    // OR, if the user *really* wants direct creation here (less secure for password handling):
    // This section would need careful thought on how to handle auth creation securely from server action.
    //
    // **Revised Approach: Using the Cloud Function as it's more robust for Auth creation.**
    // The Cloud Function will need to be updated to accept the password if provided,
    // or generate one if not, and return it for the email.
    // For now, we'll stick to the existing Cloud Function and assume it handles password (default or provided).
    // The UI will collect a password and the invite flag.

    const createStaffAuthUserCallable = httpsCallable(functions, 'createStaffAuthUser');
    const authResult = await createStaffAuthUserCallable({
      email: formData.email,
      password: formData.passwordForNewUser, // Pass the admin-set password
      displayName: formData.name,
      department: formData.department,
    }) as { data: { success: boolean; uid?: string; message?: string } };

    if (!authResult.data.success || !authResult.data.uid) {
      throw new Error(authResult.data.message || 'Cloud Function "createStaffAuthUser" failed.');
    }
    const authUid = authResult.data.uid;

    // 2. Create Firestore document in /staff collection (this remains local to this action)
    const newStaffDocRef = doc(collection(db, 'staff'));
    await setDoc(newStaffDocRef, {
      authUid: authUid,
      name: formData.name,
      email: formData.email,
      department: formData.department,
      phone: formData.phone || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 3. Conceptually send email if requested
    if (formData.sendInviteEmail) {
      // In a real app, you'd render the React Email template and send it
      console.log(`TODO: Send staff invite email to ${formData.email} with password: ${formData.passwordForNewUser}`);
      // Example:
      // const emailHtml = render(<StaffInviteEmail staffName={formData.name} staffEmail={formData.email} temporaryPassword={formData.passwordForNewUser} ... />);
      // await sendEmail({ to: formData.email, subject: "Welcome to the Team!", html: emailHtml });
      // This part requires an actual email sending service setup.
    }

    return { 
        success: true, 
        message: `Staff member ${formData.name} created. Auth account and user record handled by Cloud Function. ${formData.sendInviteEmail ? 'Invite email queued (simulated).' : ''}`, 
        staffId: newStaffDocRef.id, 
        authUid 
    };
  } catch (error: any) {
    console.error('Error in addStaffAction:', error);
    let detailedMessage = 'Failed to add staff member.';
    if (error.code === 'functions/not-found' || (error.message && error.message.toLowerCase().includes("createStaffAuthUser".toLowerCase()) && error.message.toLowerCase().includes("not found"))) {
        detailedMessage = 'Failed to add staff member: The "createStaffAuthUser" Cloud Function was not found or is misconfigured. Please ensure it is deployed.';
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
      let departmentFromUser = staffData.department;
      
      if (staffData.authUid) {
        const userDocRef = doc(db, 'users', staffData.authUid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          isDisabled = userData?.isDisabled === undefined ? false : userData.isDisabled;
          departmentFromUser = userData?.department || staffData.department; 
        } else {
          console.warn(`User document not found for staff authUid: ${staffData.authUid}. Using staff record data for status/department.`);
        }
      } else {
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

  if (formData.email !== existingStaffData.email) {
      return { success: false, message: "Email address cannot be changed through this form."};
  }

  try {
    const batch = writeBatch(db);
    
    batch.update(staffRef, {
      name: formData.name,
      department: formData.department,
      phone: formData.phone,
      updatedAt: serverTimestamp(),
    });

    if (existingStaffData.authUid) {
      const userRef = doc(db, 'users', existingStaffData.authUid);
      const userSnap = await getDoc(userRef); 
      if (userSnap.exists()) {
          const userUpdateData: any = {
            displayName: formData.name,
            department: formData.department,
            updatedAt: serverTimestamp(),
          };
          batch.update(userRef, userUpdateData);
      } else {
        console.warn(`User document not found for staff authUid: ${existingStaffData.authUid} during update. Only local staff record updated.`);
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
  const effectiveAuthUid = authUid || staffData.authUid; 

  if (!effectiveAuthUid) {
    await deleteDoc(staffRef);
    console.warn(`Staff record ${staffId} deleted, but no authUid was found. Corresponding Auth user/user record might need manual review/deletion.`);
    return { success: true, message: 'Local staff record deleted. Linked Auth user/user record could not be automatically processed due to missing authUid.' };
  }

  try {
    const deleteStaffAuthUserCallable = httpsCallable(functions, 'deleteStaffAuthUser');
    const authDeletionResult = await deleteStaffAuthUserCallable({ uid: effectiveAuthUid }) as { data: { success: boolean; message?: string } };

    if (!authDeletionResult.data.success) {
      throw new Error(authDeletionResult.data.message || 'Cloud Function "deleteStaffAuthUser" failed to delete user.');
    }
    
    await deleteDoc(staffRef);

    return { success: true, message: 'Staff member, their Auth account, and user record were deleted successfully via Cloud Function. Local staff record also removed.' };
  } catch (error: any) {
    console.error('Full error details in deleteStaffAction:', error);
    let detailedMessage = 'Failed to delete staff member.';
     if (error.code === 'functions/not-found' || (error.message && error.message.toLowerCase().includes("deleteStaffAuthUser".toLowerCase()) && error.message.toLowerCase().includes("not found"))) {
        detailedMessage = 'Failed to delete staff member: The "deleteStaffAuthUser" Cloud Function was not found. Please ensure it is correctly deployed and the name matches.';
    } else if (error.message) {
        detailedMessage = `Failed to delete staff member: ${error.message}`;
    }
    return { success: false, message: detailedMessage };
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
