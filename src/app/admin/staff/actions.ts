
'use server';

import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, updateDoc, deleteDoc, query, where, Timestamp, writeBatch, setDoc, orderBy } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { render } from 'react-email'; // Corrected import
import { StaffInviteEmail } from '@/emails/staff-invite-email';
import { getAgencySettingsAction } from '@/app/admin/settings/actions';
import React from 'react'; // Ensure React is imported for React.createElement


// Department Configuration
const STAFF_DEPARTMENTS_CONFIG: Record<string, { name: string; color: string; textColor?: string }> = {
  'Client Success & Onboarding': { name: 'Client Success & Onboarding', color: 'hsl(207, 70%, 50%)', textColor: 'hsl(0, 0%, 100%)' },
  'VA Operations': { name: 'VA Operations', color: 'hsl(145, 63%, 42%)', textColor: 'hsl(0, 0%, 100%)' },
  'Sales & Account Management': { name: 'Sales & Account Management', color: 'hsl(30, 90%, 50%)', textColor: 'hsl(0, 0%, 100%)' },
  'HR / VA Talent': { name: 'HR / VA Talent', color: 'hsl(260, 60%, 55%)', textColor: 'hsl(0, 0%, 100%)' },
  'Automation & AI': { name: 'Automation & AI', color: 'hsl(180, 50%, 45%)', textColor: 'hsl(0, 0%, 100%)' },
  'Marketing & Content': { name: 'Marketing & Content', color: 'hsl(330, 70%, 55%)', textColor: 'hsl(0, 0%, 100%)' },
  'IT Support': { name: 'IT Support', color: 'hsl(0, 0%, 40%)', textColor: 'hsl(0, 0%, 100%)' },
  'Finance & Billing': { name: 'Finance & Billing', color: 'hsl(45, 100%, 50%)', textColor: 'hsl(210, 29%, 10%)' },
  'QA & Training': { name: 'QA & Training', color: 'hsl(240, 60%, 65%)', textColor: 'hsl(0, 0%, 100%)' },
  'Product/UX': { name: 'Product/UX', color: 'hsl(350, 75%, 60%)', textColor: 'hsl(0, 0%, 100%)' },
};
const STAFF_DEPARTMENT_NAMES = Object.keys(STAFF_DEPARTMENTS_CONFIG);

const staffFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().email("Invalid email address.").max(100),
  department: z.enum(STAFF_DEPARTMENT_NAMES as [string, ...string[]]),
  phone: z.string().max(20).optional().or(z.literal('')),
});
export type StaffFormData = z.infer<typeof staffFormSchema>;

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

interface AdminUserData {
    displayName?: string | null;
    email?: string | null;
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

  let adminUserData: AdminUserData | null = null;
  if (adminId) {
      const adminDocRef = doc(db, 'users', adminId);
      const adminDocSnap = await getDoc(adminDocRef);
      if (adminDocSnap.exists()) {
          adminUserData = adminDocSnap.data() as AdminUserData;
      }
  }

  try {
    const createStaffAuthUserCallable = httpsCallable(functions, 'createStaffAuthUser');
    const authResult = await createStaffAuthUserCallable({
      email: formData.email,
      password: formData.passwordForNewUser, // Make sure CF uses this
      displayName: formData.name,
      department: formData.department,
    }) as { data: { success: boolean; uid?: string; message?: string } };

    if (!authResult.data.success || !authResult.data.uid) {
      throw new Error(authResult.data.message || 'Cloud Function "createStaffAuthUser" failed.');
    }
    const authUid = authResult.data.uid;

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

    let emailSentMessage = "";
    if (formData.sendInviteEmail) {
      try {
        const agencySettings = await getAgencySettingsAction();
        const agencyName = agencySettings?.agencyName || "Tiny Tasks VA Services";
        const agencyLogoUrl = agencySettings?.agencyLogoUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/static/agency-logo.png`;
        
        let adminDisplayNameForEmail = adminUserData?.displayName || adminUserData?.email || adminId;

        const emailProps = {
          staffName: formData.name,
          staffEmail: formData.email,
          temporaryPassword: formData.passwordForNewUser,
          agencyName: agencyName,
          agencyLogoUrl: agencyLogoUrl,
          signInLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/auth`,
          adminUsername: adminDisplayNameForEmail,
        };
        const emailComponent = React.createElement(StaffInviteEmail, emailProps);
        const emailHtml = render(emailComponent);

        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'production',
          }
        });

        const mailOptions = {
          from: `"${process.env.SMTP_FROM_NAME || 'Tiny Tasks VA'}" <${process.env.SMTP_FROM_EMAIL || 'noreply@tinytasks.com'}>`,
          to: formData.email,
          subject: `You're Invited to Join ${agencyName}!`,
          html: emailHtml,
        };

        await transporter.sendMail(mailOptions);
        emailSentMessage = " Invitation email sent.";
        console.log(`Staff invitation email sent to ${formData.email}`);
      } catch (emailError: any) {
        console.error('Error sending staff invitation email:', emailError);
        emailSentMessage = ` Staff member created, but failed to send invitation email: ${emailError.message}`;
      }
    }

    return {
        success: true,
        message: `Staff member ${formData.name} created successfully.${emailSentMessage}`,
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
            const dateObj = timestamp.toDate();
            if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
                 return dateObj.toISOString();
            }
             console.warn("toDate() did not return a valid Date for staff actions. It might be an uncommitted ServerTimestamp:", timestamp);
            return new Date().toISOString();
        }
        const d = new Date(timestamp);
        if (!isNaN(d.getTime())) return d.toISOString();
    } catch (e) {
       console.warn("Error converting timestamp in convertDbTimestamp for staff:", e, timestamp);
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
      let nameFromUser = staffData.name;
      let emailFromUser = staffData.email;
      let phoneFromUser = staffData.phone;


      if (staffData.authUid) {
        const userDocRef = doc(db, 'users', staffData.authUid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          isDisabled = userData?.isDisabled === undefined ? false : userData.isDisabled;
          departmentFromUser = userData?.department || staffData.department;
          nameFromUser = userData?.displayName || staffData.name;
          emailFromUser = userData?.email || staffData.email;
          phoneFromUser = userData?.phone || staffData.phone;
        } else {
          console.warn(`User document not found for staff authUid: ${staffData.authUid}. Using staff record data.`);
        }
      } else {
         console.warn(`Staff record ${staffDoc.id} is missing authUid. Data might not be fully synced with user account.`);
      }


      staffList.push({
        id: staffDoc.id,
        name: nameFromUser || '',
        email: emailFromUser || '',
        department: departmentFromUser,
        phone: phoneFromUser || '',
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
    let nameFromUser = data.name;
    let emailFromUser = data.email;
    let phoneFromUser = data.phone;

    if (data.authUid) {
      const userDocRef = doc(db, 'users', data.authUid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        isDisabled = userData?.isDisabled === undefined ? false : userData.isDisabled;
        departmentFromUser = userData?.department || data.department;
        nameFromUser = userData?.displayName || data.name;
        emailFromUser = userData?.email || data.email;
        phoneFromUser = userData?.phone || data.phone;
      }
    }

    return {
      id: staffDocSnap.id,
      name: nameFromUser || '',
      email: emailFromUser || '',
      department: departmentFromUser,
      phone: phoneFromUser || '',
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
      phone: formData.phone || '',
      updatedAt: serverTimestamp(),
    });

    if (existingStaffData.authUid) {
      const userRef = doc(db, 'users', existingStaffData.authUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
          const userUpdateData: any = {
            displayName: formData.name,
            department: formData.department,
            phone: formData.phone || userSnap.data()?.phone || '',
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
                phone: formData.phone || usersSnapshot.docs[0].data()?.phone || '',
                updatedAt: serverTimestamp(),
            };
            batch.update(userRef, userUpdateData);
            batch.update(staffRef, { authUid: usersSnapshot.docs[0].id });
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
    console.warn(`Staff record ${staffId} deleted from Firestore. No authUid was found, so Firebase Auth user and /users record might need manual review/deletion if they exist under a different linkage.`);
    return { success: true, message: 'Local staff record deleted. Corresponding Auth user/user record could not be automatically processed due to missing authUid. Please verify manually.' };
  }

  try {
    const deleteStaffAuthUserCallable = httpsCallable(functions, 'deleteStaffAuthUser');
    const authDeletionResult = await deleteStaffAuthUserCallable({ uid: effectiveAuthUid }) as { data: { success: boolean; message?: string } };

    if (!authDeletionResult.data.success) {
      console.warn(`Cloud Function "deleteStaffAuthUser" failed for UID ${effectiveAuthUid}: ${authDeletionResult.data.message}. Attempting to delete local staff record.`);
      await deleteDoc(staffRef);
      return { success: false, message: `Auth/User record deletion failed via Cloud Function: ${authDeletionResult.data.message}. Local staff record was deleted. Please verify Firebase Auth users.` };
    }

    await deleteDoc(staffRef);

    return { success: true, message: 'Staff member, their Auth account, and user record were deleted successfully via Cloud Function. Local staff record also removed.' };
  } catch (error: any) {
    console.error('Full error details in deleteStaffAction:', error);
    let detailedMessage = 'Failed to delete staff member.';
     if (error.code === 'functions/not-found' || (error.message && error.message.toLowerCase().includes("deleteStaffAuthUser".toLowerCase()) && error.message.toLowerCase().includes("not found"))) {
        detailedMessage = 'Failed to delete staff member: The "deleteStaffAuthUser" Cloud Function was not found or is misconfigured. Please ensure it is deployed and the name matches.';
    } else if (error.message) {
        detailedMessage = `Failed to delete staff member: ${error.message}`;
    }
    try {
        if (staffSnap.exists()) await deleteDoc(staffRef);
    } catch (fsDelError) {
        console.error("Failed to delete local staff record after other error:", fsDelError);
        detailedMessage += " Also failed to cleanup local staff record.";
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
