
"use client";

import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'client' | 'staff' | string; // Role can be one of these or extended
  createdAt: any; // Firestore Timestamp
}

interface AuthState {
  isLoading: boolean;
  user: User | null;
  userData: UserData | null;
  isAdmin: boolean;
}

export function useAdminAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    user: null,
    userData: null,
    isAdmin: false,
  });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserData;
          const isAdmin = userData.role === 'admin';
          setAuthState({ isLoading: false, user: firebaseUser, userData, isAdmin });
          if (!isAdmin && window.location.pathname.startsWith('/admin')) {
            toast({ title: 'Access Denied', description: 'You do not have permission to access this page.', variant: 'destructive' });
            router.replace('/'); // Redirect non-admins from admin pages
          }
        } else {
          // User exists in Auth but not in Firestore (should not happen with current signup flow)
          setAuthState({ isLoading: false, user: firebaseUser, userData: null, isAdmin: false });
           if (window.location.pathname.startsWith('/admin')) {
            toast({ title: 'Access Denied', description: 'User data not found.', variant: 'destructive' });
            router.replace('/');
          }
        }
      } else {
        // No user logged in
        setAuthState({ isLoading: false, user: null, userData: null, isAdmin: false });
        if (window.location.pathname.startsWith('/admin')) {
          toast({ title: 'Authentication Required', description: 'Please sign in to access the admin area.', variant: 'destructive' });
          router.replace('/auth'); // Redirect to login if trying to access admin pages
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  return authState;
}

// A simple toast function to avoid importing useToast everywhere in this hook
// In a real app, you might have a global toast context or service
const toast = (options: { title: string; description: string; variant?: 'destructive' | 'default' }) => {
  console.log(`Toast: ${options.title} - ${options.description} (${options.variant || 'default'})`);
  // This is a placeholder. Actual toast implementation would use `useToast` from ShadCN
  // but to keep this hook self-contained for now, we'll log.
  // For actual UI feedback, components using this hook should handle toasts if needed,
  // or this hook could be refactored to use a global toast dispatcher.
};
