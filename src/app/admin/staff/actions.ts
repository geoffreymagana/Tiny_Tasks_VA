
'use server';

import { admin, adminAuth, adminDb } from '@/lib/firebase-admin-init';
import { Timestamp, FieldValue, CollectionReference, Query, DocumentReference } from 'firebase-admin/firestore';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { render } from 'react-email'; // Corrected: Import from the main react-email package
import { StaffInviteEmail } from '@/emails/staff-invite-email';
import { getAgencySettingsAction } from '@/app/admin/settings/actions';
import React from 'react';

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
  if (!adminDb) {
    // This path should ideally not be hit if firebase-admin-init throws on failure
    console.error("CRITICAL (verifyAdmin): Firebase Admin DB is not initialized. Cannot verify admin.");
    return false;
  }
  if (!adminId) return false;
  const adminUserDocRef = adminDb.doc(`users/${adminId}`);
  const adminDoc = await adminUserDocRef.get();
  return adminDoc.exists && adminDoc.data()?.role === 'admin';
}

async function isEmailUniqueInStaffCollection(email: string, currentStaffId?: string): Promise<boolean> {
  if (!adminDb) {
    console.error("CRITICAL (isEmailUniqueInStaffCollection): Firebase Admin DB is not initialized. Cannot check email uniqueness.");
    return false; 
  }
  const q = adminDb.collection('staff').where('email', '==', email);
  const querySnapshot = await q.get();
  if (querySnapshot.empty) return true;
  if (currentStaffId && querySnapshot.docs[0].id === currentStaffId) return true;
  return false;
}


export async function addStaffAction(
  formData: CreateStaffActionData,
  adminId: string
): Promise<StaffOperationResult> {
  if (!adminAuth || !adminDb) { 
    return { success: false, message: 'Firebase Admin SDK not initialized properly. Cannot add staff.' };
  }
  if (!(await verifyAdmin(adminId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  if (!(await isEmailUniqueInStaffCollection(formData.email))) {
     return { success: false, message: 'This email address is already in use by an existing staff record.' };
  }

  let adminUserData: AdminUserData | null = null;
  if (adminId) {
      const adminDocRef = adminDb.doc(`users/${adminId}`);
      const adminDocSnap = await adminDocRef.get();
      if (adminDocSnap.exists) {
          adminUserData = adminDocSnap.data() as AdminUserData;
      }
  }

  try {
    const userRecord = await adminAuth.createUser({
      email: formData.email,
      password: formData.passwordForNewUser,
      displayName: formData.name,
      emailVerified: false,
    });
    const authUid = userRecord.uid;

    const batch = adminDb.batch();

    const userDocRef = adminDb.doc(`users/${authUid}`);
    batch.set(userDocRef, {
      uid: authUid,
      email: formData.email,
      displayName: formData.name,
      role: 'staff',
      department: formData.department,
      phone: formData.phone || '',
      isDisabled: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const newStaffDocRef = adminDb.collection('staff').doc();
    batch.set(newStaffDocRef, {
      authUid: authUid,
      name: formData.name,
      email: formData.email,
      department: formData.department,
      phone: formData.phone || '',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

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
        const emailHtml = render(emailComponent); // render() comes from 'react-email'

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

        await transporter.sendMail({
          from: `"${process.env.SMTP_FROM_NAME || 'Tiny Tasks VA'}" <${process.env.SMTP_FROM_EMAIL || 'noreply@tinytasks.com'}>`,
          to: formData.email,
          subject: `You're Invited to Join ${agencyName}!`,
          html: emailHtml,
        });
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
    let detailedMessage = `Failed to add staff member: ${error.message || 'Unknown error'}`;
    if (error.code === 'auth/email-already-exists') {
        detailedMessage = 'This email address is already in use by an existing authentication account.';
    }
    return { success: false, message: detailedMessage };
  }
}


const convertDbTimestamp = (timestampField: any): string | null => {
    if (!timestampField) return null;
    if (admin && admin.firestore && timestampField instanceof admin.firestore.Timestamp) { 
        return timestampField.toDate().toISOString();
    }
    if (typeof Timestamp !== 'undefined' && timestampField instanceof Timestamp) { // Client-side Timestamp (less likely here)
        return timestampField.toDate().toISOString();
    }
    if (typeof timestampField === 'object' && timestampField !== null && typeof timestampField.toDate === 'function') {
      try {
        const dateObj = timestampField.toDate();
        if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
             return dateObj.toISOString();
        }
        console.warn("toDate() did not return a valid Date for staff actions:", timestampField);
        return new Date().toISOString(); 
      } catch (e) {
        console.warn("Error calling toDate() on timestamp-like object:", e, timestampField);
        return null;
      }
    }
    if (timestampField instanceof Date) {
        return timestampField.toISOString();
    }
    if (typeof timestampField === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(timestampField)) {
      return timestampField;
    }
     if (typeof timestampField === 'object' && timestampField !== null && typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
       try {
         return new Date(timestampField.seconds * 1000 + timestampField.nanoseconds / 1000000).toISOString();
       } catch (e) {
         console.warn("Error converting object with sec/ns to Timestamp for staff:", e, timestampField);
         return null;
       }
    }
    console.warn("Unsupported timestamp format encountered in convertDbTimestamp for staff:", timestampField);
    return null;
};

export async function getAllStaffAction(): Promise<StaffMember[]> {
  if (!adminDb) {
    console.error("CRITICAL (getAllStaffAction): Firebase Admin DB is not initialized. Cannot get all staff.");
    return [];
  }
  try {
    type StaffDocDataType = Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt' | 'isDisabled' | 'department' | 'name' | 'email' | 'phone'> & { createdAt: any, updatedAt: any, authUid?: string, department?: string, name?:string, email?:string, phone?:string };
    const staffCollectionRef = adminDb.collection('staff') as CollectionReference<StaffDocDataType>;
    const staffQuery = staffCollectionRef.orderBy('createdAt', 'desc');
    const staffSnapshot = await staffQuery.get();

    const staffList: StaffMember[] = [];

    for (const staffDoc of staffSnapshot.docs) {
      const staffData = staffDoc.data();
      let isDisabled = false;
      let departmentFromUser = staffData.department;
      let nameFromUser = staffData.name;
      let emailFromUser = staffData.email;
      let phoneFromUser = staffData.phone;


      if (staffData.authUid) {
        const userDocRef = adminDb.doc(`users/${staffData.authUid}`);
        const userDocSnap = await userDocRef.get();
        if (userDocSnap.exists) {
          const userData = userDocSnap.data() as {isDisabled?: boolean, department?: string, displayName?: string, email?: string, phone?: string };
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
        department: departmentFromUser as (typeof STAFF_DEPARTMENT_NAMES)[number],
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
  if (!adminDb) {
    console.error("CRITICAL (getStaffAction): Firebase Admin DB is not initialized. Cannot get staff member.");
    return null;
  }
  try {
    const staffDocRef = adminDb.doc(`staff/${staffId}`);
    const staffDocSnap = await staffDocRef.get();

    if (!staffDocSnap.exists) {
      return null;
    }
    const data = staffDocSnap.data() as Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt' | 'isDisabled' | 'department' | 'name' | 'email' | 'phone'> & { createdAt: any, updatedAt: any, authUid?: string, department?: string, name?:string, email?:string, phone?:string };
    let isDisabled = false;
    let departmentFromUser = data.department;
    let nameFromUser = data.name;
    let emailFromUser = data.email;
    let phoneFromUser = data.phone;

    if (data.authUid) {
      const userDocRef = adminDb.doc(`users/${data.authUid}`);
      const userDocSnap = await userDocRef.get();
      if (userDocSnap.exists) {
        const userData = userDocSnap.data() as {isDisabled?: boolean, department?: string, displayName?: string, email?: string, phone?: string };
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
      department: departmentFromUser as (typeof STAFF_DEPARTMENT_NAMES)[number],
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
  adminUserId: string
): Promise<StaffOperationResult> {
  if (!adminAuth || !adminDb) {
    return { success: false, message: 'Firebase Admin SDK not initialized properly. Cannot update staff.' };
  }
  if (!(await verifyAdmin(adminUserId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  const staffRef = adminDb.doc(`staff/${staffId}`);
  const staffSnap = await staffRef.get();
  if (!staffSnap.exists) {
    return { success: false, message: 'Staff member not found in "staff" collection.' };
  }
  const existingStaffData = staffSnap.data() as Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt' | 'isDisabled'> & { authUid?: string; email?: string; };


  if (formData.email !== existingStaffData.email) {
      return { success: false, message: "Email address cannot be changed through this form."};
  }

  try {
    const batch = adminDb.batch();

    batch.update(staffRef, {
      name: formData.name,
      department: formData.department,
      phone: formData.phone || '',
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (existingStaffData.authUid) {
      const userRef = adminDb.doc(`users/${existingStaffData.authUid}`);
      const userSnap = await userRef.get();
      if (userSnap.exists) {
          const userDataFromDb = userSnap.data() as { phone?: string };
          const userUpdateData: any = {
            displayName: formData.name,
            department: formData.department,
            phone: formData.phone || userDataFromDb?.phone || '',
            updatedAt: FieldValue.serverTimestamp(),
          };
          batch.update(userRef, userUpdateData);
      } else {
        console.warn(`User document not found for staff authUid: ${existingStaffData.authUid} during update. Only local staff record updated.`);
      }
    } else {
        const usersCollectionRef = adminDb.collection('users') as CollectionReference<{phone?:string}>;
        const usersQuery = usersCollectionRef.where('email', '==', existingStaffData.email).where('role', '==', 'staff');
        const usersSnapshot = await usersQuery.get();
        if (!usersSnapshot.empty) {
            const userRef = usersSnapshot.docs[0].ref as DocumentReference<{phone?:string}>;
            const userDataFromDb = usersSnapshot.docs[0].data() as { phone?: string };
             const userUpdateData: any = {
                displayName: formData.name,
                department: formData.department,
                phone: formData.phone || userDataFromDb?.phone || '',
                updatedAt: FieldValue.serverTimestamp(),
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
  adminUserId: string
): Promise<StaffOperationResult> {
  if (!adminAuth || !adminDb) {
    return { success: false, message: 'Firebase Admin SDK not initialized properly. Cannot delete staff.' };
  }
  if (!(await verifyAdmin(adminUserId))) {
    return { success: false, message: 'User does not have admin privileges.' };
  }

  const staffRef = adminDb.doc(`staff/${staffId}`);
  const staffSnap = await staffRef.get();
  if (!staffSnap.exists()) {
    return { success: false, message: 'Staff record not found for deletion.' };
  }
  const staffData = staffSnap.data() as Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt' | 'isDisabled'> & { authUid?: string };
  const effectiveAuthUid = authUid || staffData.authUid;

  try {
    const batch = adminDb.batch();
    batch.delete(staffRef);

    if (effectiveAuthUid) {
      try {
        await adminAuth.deleteUser(effectiveAuthUid);
        console.log(`Successfully deleted Firebase Auth user: ${effectiveAuthUid}`);
      } catch (authError: any) {
        if (authError.code === 'auth/user-not-found') {
          console.warn(`Firebase Auth user ${effectiveAuthUid} not found, possibly already deleted.`);
        } else {
          console.error(`Error deleting Firebase Auth user ${effectiveAuthUid}:`, authError.message);
        }
      }
      const userDocRef = adminDb.doc(`users/${effectiveAuthUid}`);
      const userDoc = await userDocRef.get();
      if (userDoc.exists) {
        batch.delete(userDocRef);
      }
    } else {
      console.warn(`Staff record ${staffId} deleted from Firestore 'staff' collection. No authUid was found.`);
    }
    await batch.commit();
    return { success: true, message: 'Staff member and associated records processed for deletion successfully.' };

  } catch (error: any) {
    console.error('Error deleting staff member:', error);
    return { success: false, message: `Failed to delete staff member: ${error.message || 'Unknown error'}` };
  }
}


export async function toggleStaffAccountDisabledStatusAction(
  authUid: string,
  adminUserId: string
): Promise<StaffOperationResult> {
  if (!adminAuth || !adminDb) {
    return { success: false, message: 'Firebase Admin SDK not initialized properly. Cannot toggle staff status.' };
  }
  if (!(await verifyAdmin(adminUserId))) {
    return { success: false, message: 'User does not have admin privileges to change account status.' };
  }

  if (!authUid) {
    return { success: false, message: 'Staff member Auth UID not provided. Cannot toggle status.' };
  }

  const userDocRef = adminDb.doc(`users/${authUid}`);
  try {
    const userDocSnap = await userDocRef.get();
    if (!userDocSnap.exists()) {
      return { success: false, message: 'Staff user account not found in users collection. Cannot toggle status.' };
    }

    const userData = userDocSnap.data() as {isDisabled?: boolean};
    const currentDisabledStatus = userData.isDisabled === undefined ? false : userData.isDisabled;
    const newDisabledStatus = !currentDisabledStatus;

    await adminAuth.updateUser(authUid, {
      disabled: newDisabledStatus,
    });

    await userDocRef.update({
      isDisabled: newDisabledStatus,
      updatedAt: FieldValue.serverTimestamp(),
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
