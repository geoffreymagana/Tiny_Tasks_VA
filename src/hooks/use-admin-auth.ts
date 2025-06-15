
"use client";

import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  bannerURL?: string | null; // Added for profile banner
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
  refetchUserData?: () => Promise<void>; // Added for explicit refetch
}

export function useAdminAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    user: null,
    userData: null,
    isAdmin: false,
  });
  const router = useRouter();

  const fetchUserData = useCallback(async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      setAuthState({ isLoading: false, user: null, userData: null, isAdmin: false, refetchUserData: () => fetchUserData(auth.currentUser) });
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        console.log('No user logged in, redirecting from admin page to /auth.');
        router.replace('/auth');
      }
      return;
    }

    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userDataFromDb = userDocSnap.data() as UserData;
        const isAdminUser = userDataFromDb.role === 'admin';
        setAuthState({ isLoading: false, user: firebaseUser, userData: userDataFromDb, isAdmin: isAdminUser, refetchUserData: () => fetchUserData(firebaseUser) });
        if (!isAdminUser && typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
          console.log('User is not admin, redirecting from admin page.');
          router.replace('/');
        }
      } else {
        console.warn('User authenticated but no Firestore record found for UID:', firebaseUser.uid);
        setAuthState({ isLoading: false, user: firebaseUser, userData: null, isAdmin: false, refetchUserData: () => fetchUserData(firebaseUser) });
         if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
          console.log('User data not found, redirecting from admin page.');
          router.replace('/');
        }
      }
    } catch (error) {
        console.error("Error fetching user document from Firestore:", error);
        setAuthState({ isLoading: false, user: firebaseUser, userData: null, isAdmin: false, refetchUserData: () => fetchUserData(firebaseUser) });
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
            router.replace('/');
        }
    }
  }, [router]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      fetchUserData(firebaseUser);
    });
    return () => unsubscribe();
  }, [fetchUserData]);

  return { ...authState, refetchUserData: () => fetchUserData(auth.currentUser) };
}
