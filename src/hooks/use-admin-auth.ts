
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
  role: 'admin' | 'client' | 'staff' | string;
  createdAt: any;
  company?: string | null;
  phone?: string | null;
  isDisabled?: boolean;
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
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as UserData;
            const isAdminUser = userData.role === 'admin';
            setAuthState({ isLoading: false, user: firebaseUser, userData, isAdmin: isAdminUser });
            if (!isAdminUser && typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
              console.log('User is not admin, redirecting from admin page.');
              router.replace('/');
            }
          } else {
            // User exists in Auth but not in Firestore
            console.warn('User authenticated but no Firestore record found for UID:', firebaseUser.uid);
            setAuthState({ isLoading: false, user: firebaseUser, userData: null, isAdmin: false });
             if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
              console.log('User data not found, redirecting from admin page.');
              router.replace('/');
            }
          }
        } catch (error) {
            console.error("Error fetching user document from Firestore:", error);
            setAuthState({ isLoading: false, user: firebaseUser, userData: null, isAdmin: false });
            if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
                router.replace('/');
            }
        }
      } else {
        // No user logged in
        setAuthState({ isLoading: false, user: null, userData: null, isAdmin: false });
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
          console.log('No user logged in, redirecting from admin page to /auth.');
          router.replace('/auth');
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  return authState;
}
