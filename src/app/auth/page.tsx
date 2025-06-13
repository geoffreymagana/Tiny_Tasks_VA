
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
import { Chrome } from 'lucide-react'; // Using Chrome icon for Google

const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});
type SignInFormValues = z.infer<typeof signInSchema>;

const signUpSchema = z.object({
  displayName: z.string().min(2, { message: 'Display name must be at least 2 characters' }).optional(),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});
type SignUpFormValues = z.infer<typeof signUpSchema>;

const AuthPage: FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  });

  const handleUserSetup = async (user: User, displayName?: string | null) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.displayName || user.email?.split('@')[0],
        photoURL: user.photoURL,
        role: 'client', // Default role
        createdAt: serverTimestamp(),
      });
    }
    // If user exists, their role and other data are preserved.
  };


  const onSignInSubmit: SubmitHandler<SignInFormValues> = async (data) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      await handleUserSetup(userCredential.user);
      toast({ title: 'Success', description: 'Signed in successfully.' });
      router.push('/'); // Redirect to homepage or dashboard
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: 'Sign In Error',
        description: error.message || 'Failed to sign in. Please check your credentials.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSignUpSubmit: SubmitHandler<SignUpFormValues> = async (data) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (data.displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName: data.displayName });
      }
      await handleUserSetup(userCredential.user, data.displayName);
      toast({ title: 'Success', description: 'Account created successfully. Please sign in.' });
       // Firebase automatically signs in the user after creation.
       // router.push('/'); // Or redirect to a "please verify email" page if implemented
       // For now, keep them on auth page, or redirect to home
      router.push('/');
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast({
        title: 'Sign Up Error',
        description: error.message || 'Failed to create account.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await handleUserSetup(result.user);
      toast({ title: 'Success', description: 'Signed in with Google successfully.' });
      router.push('/'); // Redirect to homepage or dashboard
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast({
        title: 'Google Sign In Error',
        description: error.message || 'Failed to sign in with Google.',
        variant: 'destructive',
      });
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
                  <Input id="email-signin" type="email" placeholder="m@example.com" {...signInForm.register('email')} disabled={isLoading} />
                  {signInForm.formState.errors.email && <p className="text-sm text-destructive">{signInForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signin">Password</Label>
                  <Input id="password-signin" type="password" {...signInForm.register('password')} disabled={isLoading} />
                  {signInForm.formState.errors.password && <p className="text-sm text-destructive">{signInForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
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
                <Chrome className="mr-2 h-4 w-4" />
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
                  <Label htmlFor="displayName-signup">Display Name (Optional)</Label>
                  <Input id="displayName-signup" placeholder="Your Name" {...signUpForm.register('displayName')} disabled={isLoading} />
                  {signUpForm.formState.errors.displayName && <p className="text-sm text-destructive">{signUpForm.formState.errors.displayName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input id="email-signup" type="email" placeholder="m@example.com" {...signUpForm.register('email')} disabled={isLoading} />
                  {signUpForm.formState.errors.email && <p className="text-sm text-destructive">{signUpForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Password</Label>
                  <Input id="password-signup" type="password" {...signUpForm.register('password')} disabled={isLoading} />
                  {signUpForm.formState.errors.password && <p className="text-sm text-destructive">{signUpForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
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
                <Chrome className="mr-2 h-4 w-4" />
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
