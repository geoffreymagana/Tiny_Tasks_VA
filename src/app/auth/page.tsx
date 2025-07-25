
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Chrome, Eye, EyeOff } from 'lucide-react'; 
import { LottieLoader } from '@/components/ui/lottie-loader';

const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});
type SignInFormValues = z.infer<typeof signInSchema>;

const signUpSchema = z.object({
  displayName: z.string().min(2, { message: 'Display name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  company: z.string().max(100, "Company name too long").optional().or(z.literal('')),
  phone: z.string().max(20, "Phone number too long").optional().or(z.literal('')),
});
type SignUpFormValues = z.infer<typeof signUpSchema>;

const AuthPage: FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { displayName: '', email: '', password: '', company: '', phone: '' },
  });

  const handleUserSetup = async (user: User, displayName?: string | null, company?: string | null, phone?: string | null) => {
    const userRef = doc(db, 'users', user.uid);
    try {
      const userSnap = await getDoc(userRef);
      const userDataToSet: any = {
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.displayName || user.email?.split('@')[0],
        photoURL: user.photoURL,
        updatedAt: serverTimestamp(),
        isDisabled: false, 
      };

      if (company) userDataToSet.company = company;
      if (phone) userDataToSet.phone = phone;

      if (!userSnap.exists()) {
        userDataToSet.createdAt = serverTimestamp();
        userDataToSet.role = 'client'; // Default role for new sign-ups
        await setDoc(userRef, userDataToSet);
        console.log('User document created in Firestore for UID:', user.uid);
      } else {
        const existingData = userSnap.data();
        const updates: any = { updatedAt: serverTimestamp() };
        if (existingData.isDisabled === undefined) {
          updates.isDisabled = false;
        }
        if (displayName && displayName !== existingData.displayName) {
          updates.displayName = displayName;
        }
        if (user.photoURL && user.photoURL !== existingData.photoURL) {
          updates.photoURL = user.photoURL;
        }
        if (company && company !== existingData.company) {
            updates.company = company;
        }
        if (phone && phone !== existingData.phone) {
            updates.phone = phone;
        }
        await setDoc(userRef, { ...existingData, ...userDataToSet, ...updates }, { merge: true });
        console.log('User document updated/merged in Firestore for UID:', user.uid);
      }
    } catch (error) {
      console.error('Error in handleUserSetup (Firestore operation):', error);
      toast({
        title: 'User Setup Error',
        description: 'Could not save user data. Please try again. If the problem persists, check your browser extensions or network.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const redirectToDashboard = async (userId: string): Promise<{ success: boolean; redirectPath: string | null; isAccountDisabled: boolean }> => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.isDisabled) {
          await auth.signOut();
          toast({
            title: 'Account Disabled',
            description: 'Your account has been disabled. Please contact support.',
            variant: 'destructive',
            duration: 7000,
          });
          router.push('/auth');
          return { success: false, redirectPath: '/auth', isAccountDisabled: true };
        }

        let path = '/'; // Default path
        let portalName = 'homepage';

        if (userData.role === 'admin') {
          path = '/admin';
          portalName = 'Admin Portal';
        } else if (userData.role === 'staff') {
          path = '/staff-portal'; // New staff portal path
          portalName = 'Staff Portal';
        } else if (userData.role === 'client') {
          path = '/client-portal'; // New client portal path
          portalName = 'Client Portal';
        }
        
        router.push(path);
        toast({ title: 'Sign In Successful', description: `Redirecting to ${portalName}...` });
        return { success: true, redirectPath: path, isAccountDisabled: false };

      } else {
        toast({ title: 'User Data Not Found', description: 'Could not retrieve user details. Redirecting to homepage.', variant: 'destructive' });
        await auth.signOut();
        router.push('/'); 
        return { success: false, redirectPath: '/', isAccountDisabled: false };
      }
    } catch (error) {
      console.error("Error fetching user role for redirection (Firestore operation):", error);
      toast({
        title: 'Redirection Error',
        description: 'Could not determine your destination. Navigating to homepage.',
        variant: 'destructive',
      });
      router.push('/');
      return { success: false, redirectPath: '/', isAccountDisabled: false };
    }
  };


  const onSignInSubmit: SubmitHandler<SignInFormValues> = async (data) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      await handleUserSetup(userCredential.user);
      await redirectToDashboard(userCredential.user.uid);
    } catch (error: any) {
      console.error('Sign in error:', error);
      if (error.code && error.message) {
         toast({
          title: 'Sign In Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else if (!error.code) {
         toast({
          title: 'Sign In Error',
          description: 'An unexpected error occurred during sign-in or user setup.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSignUpSubmit: SubmitHandler<SignUpFormValues> = async (data) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const userToSetup = auth.currentUser || userCredential.user;
      if (data.displayName && userToSetup) {
        await updateProfile(userToSetup, { displayName: data.displayName });
      }
      await handleUserSetup(userToSetup, data.displayName || userToSetup.displayName, data.company, data.phone);
      await redirectToDashboard(userToSetup.uid);
    } catch (error: any)
    {
      console.error('Sign up error:', error);
       if (error.code && error.message) {
         toast({
          title: 'Sign Up Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else if (!error.code) {
         toast({
          title: 'Sign Up Error',
          description: 'An unexpected error occurred during sign-up or user setup.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await handleUserSetup(result.user, result.user.displayName, null, null); 
      await redirectToDashboard(result.user.uid);
    } catch (error: any) {
      console.error('Google sign in error:', error);
      if (error.code && error.message) {
        toast({
          title: 'Google Sign-In Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
         toast({
          title: 'Google Sign-In Error',
          description: 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Tabs defaultValue="signin" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Sign In</CardTitle>
              <CardDescription>Access your Tiny Tasks account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={signInForm.handleSubmit(onSignInSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signin">Email</Label>
                  <Input id="email-signin" type="email" placeholder="m@example.com" {...signInForm.register('email')} disabled={isLoading} autoComplete="email" />
                  {signInForm.formState.errors.email && <p className="text-sm text-destructive">{signInForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signin">Password</Label>
                  <div className="relative">
                    <Input 
                      id="password-signin" 
                      type={showSignInPassword ? "text" : "password"} 
                      {...signInForm.register('password')} 
                      disabled={isLoading} 
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                    >
                      {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">{showSignInPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                  </div>
                  {signInForm.formState.errors.password && <p className="text-sm text-destructive">{signInForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <LottieLoader size={24} className="mr-2"/> : null}
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
               <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                {isLoading ? <LottieLoader size={20} className="mr-2" /> : <Chrome className="mr-2 h-4 w-4" /> }
                Google
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Sign Up</CardTitle>
              <CardDescription>Create your new Tiny Tasks account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)} className="space-y-4">
                 <div className="space-y-2">
                  <Label htmlFor="displayName-signup">Display Name</Label>
                  <Input id="displayName-signup" placeholder="Your Name" {...signUpForm.register('displayName')} disabled={isLoading} autoComplete="name" />
                  {signUpForm.formState.errors.displayName && <p className="text-sm text-destructive">{signUpForm.formState.errors.displayName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input id="email-signup" type="email" placeholder="m@example.com" {...signUpForm.register('email')} disabled={isLoading} autoComplete="email"/>
                  {signUpForm.formState.errors.email && <p className="text-sm text-destructive">{signUpForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Password</Label>
                  <div className="relative">
                    <Input 
                      id="password-signup" 
                      type={showSignUpPassword ? "text" : "password"} 
                      {...signUpForm.register('password')} 
                      disabled={isLoading} 
                      autoComplete="new-password"
                      className="pr-10"
                    />
                     <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    >
                      {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">{showSignUpPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                  </div>
                  {signUpForm.formState.errors.password && <p className="text-sm text-destructive">{signUpForm.formState.errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-signup">Company (Optional)</Label>
                  <Input id="company-signup" placeholder="Your Company Inc." {...signUpForm.register('company')} disabled={isLoading} autoComplete="organization" />
                  {signUpForm.formState.errors.company && <p className="text-sm text-destructive">{signUpForm.formState.errors.company.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone-signup">Phone Number (Optional)</Label>
                  <Input id="phone-signup" type="tel" placeholder="+1 555-123-4567" {...signUpForm.register('phone')} disabled={isLoading} autoComplete="tel" />
                  {signUpForm.formState.errors.phone && <p className="text-sm text-destructive">{signUpForm.formState.errors.phone.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <LottieLoader size={24} className="mr-2"/> : null}
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                </Button>
              </form>
            </CardContent>
             <CardFooter className="flex flex-col gap-4">
               <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                 {isLoading ? <LottieLoader size={20} className="mr-2" /> : <Chrome className="mr-2 h-4 w-4" /> }
                Google
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthPage;
