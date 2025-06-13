
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { LottieLoader } from '@/components/ui/lottie-loader';
import { ArrowLeft, Save, UserPlus, Eye, EyeOff } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

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
  name: z.string().min(2, "Name must be at least 2 characters.").max(100, "Name too long."),
  email: z.string().email("Invalid email address.").max(100, "Email too long."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  department: z.enum(STAFF_DEPARTMENT_NAMES as [string, ...string[]], {
    errorMap: () => ({ message: "Please select a valid department." }),
  }),
  phone: z.string().max(20, "Phone number too long.").optional().or(z.literal('')),
});

export type StaffFormData = z.infer<typeof staffFormSchema>;

const CreateStaffPage: FC = () => {
  const { toast } = useToast();
  const router = useRouter();
  const { user: adminFirebaseUser } = useAdminAuth(); // Renamed to avoid conflict
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      department: undefined, 
      phone: '',
    },
  });

  const handleSaveStaff: SubmitHandler<StaffFormData> = async (data) => {
    setIsSubmitting(true);
    if (!adminFirebaseUser?.uid) { // Check original admin user
      toast({ title: 'Authentication Error', description: 'Admin not authenticated.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const newStaffUser = userCredential.user;

      // 2. Update Firebase Auth profile (displayName)
      await updateProfile(newStaffUser, { displayName: data.name });

      // 3. Create Firestore document in /users collection
      const userDocRef = doc(db, 'users', newStaffUser.uid);
      await setDoc(userDocRef, {
        uid: newStaffUser.uid,
        email: newStaffUser.email,
        displayName: data.name,
        role: 'staff',
        department: data.department,
        isDisabled: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 4. Create Firestore document in /staff collection
      const staffCollectionRef = collection(db, 'staff');
      const newStaffDocRef = doc(staffCollectionRef); // Auto-generate ID for staff specific record
      await setDoc(newStaffDocRef, {
        authUid: newStaffUser.uid,
        name: data.name,
        email: data.email,
        department: data.department,
        phone: data.phone || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      toast({
        title: 'Staff Member Created',
        description: `${data.name} has been successfully created. You are now logged in as this new staff member. To continue admin tasks, please sign out and sign back in with your admin credentials.`,
        duration: 10000, // Longer duration for this important message
      });

      // After this, the onAuthStateChanged listener in useAdminAuth should pick up the new user,
      // and redirectToDashboard in auth/page.tsx (if it's still part of that flow)
      // or a similar logic should redirect to the staff portal.
      // If not, we might need to explicitly call router.push here for the staff portal.
      // For now, relying on the auth state change to trigger redirection.
      // Explicitly push to a known location to ensure admin sees they are logged in as new user.
      router.push('/admin/staff'); // Or '/staff-portal' once that's ready

    } catch (error: any) {
      console.error('Error creating staff member:', error);
      toast({
        title: 'Staff Creation Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
        duration: 7000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Button variant="outline" asChild className="mb-6">
        <Link href="/admin/staff">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Staff Hub
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-primary flex items-center">
            <UserPlus className="mr-3 h-7 w-7" /> Add New Staff Member
          </CardTitle>
          <CardDescription>
            Enter details for the new staff member. This will create a new user account.
            The admin performing this action will be temporarily signed in as the new staff member.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveStaff)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Alex Johnson" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="e.g., alex.johnson@example.com" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter a strong password"
                          {...field}
                          disabled={isSubmitting}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STAFF_DEPARTMENT_NAMES.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {STAFF_DEPARTMENTS_CONFIG[dept]?.name || dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="e.g., +1 555-987-6543" {...field} value={field.value ?? ''} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting || !adminFirebaseUser} size="lg">
                {isSubmitting ? <LottieLoader className="mr-2" size={20} /> : <Save className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Adding Staff...' : 'Add Staff Member'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateStaffPage;
