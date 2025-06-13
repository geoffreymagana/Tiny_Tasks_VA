
"use client";

import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { 
    getAllStaffAction, 
    deleteStaffAction, 
    toggleStaffAccountDisabledStatusAction, 
    type StaffMember, 
    type StaffOperationResult,
} from './actions';
import { LottieLoader } from '@/components/ui/lottie-loader';
import { PlusCircle, UsersRound, Edit3, Trash2, UserX, UserCheck, ShieldAlert } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Department Configuration (moved from actions.ts)
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
// const STAFF_DEPARTMENT_NAMES = Object.keys(STAFF_DEPARTMENTS_CONFIG); // Not directly used in this file anymore

const StaffHubPage: FC = () => {
  const { toast } = useToast();
  const { user: firebaseUser } = useAdminAuth();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [staffToProcess, setStaffToProcess] = useState<StaffMember | null>(null);
  const [dialogActionType, setDialogActionType] = useState<'delete' | 'toggleStatus' | null>(null);

  const fetchStaff = useCallback(async () => {
    setIsLoadingStaff(true);
    try {
      const fetchedStaff = await getAllStaffAction();
      setStaffMembers(fetchedStaff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast({ title: "Error", description: "Could not fetch staff members.", variant: "destructive" });
    } finally {
      setIsLoadingStaff(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const openDialog = (staff: StaffMember, actionType: 'delete' | 'toggleStatus') => {
    if (actionType === 'toggleStatus' && !staff.authUid) {
        toast({
            title: "Action Not Available",
            description: "This staff member does not have a linked authentication account to disable/enable.",
            variant: "default",
            duration: 5000,
        });
        return;
    }
    setStaffToProcess(staff);
    setDialogActionType(actionType);
  };

  const handleDialogAction = async () => {
    if (!staffToProcess || !firebaseUser?.uid || !dialogActionType) {
      toast({ title: 'Error', description: 'Action cannot be performed.', variant: 'destructive'});
      setDialogActionType(null); 
      setStaffToProcess(null);
      return;
    }
    setIsProcessing(true);
    let result: StaffOperationResult | null = null;

    if (dialogActionType === 'delete') {
      result = await deleteStaffAction(staffToProcess.id, staffToProcess.authUid, firebaseUser.uid);
    } else if (dialogActionType === 'toggleStatus' && staffToProcess.authUid) {
      result = await toggleStaffAccountDisabledStatusAction(staffToProcess.authUid, firebaseUser.uid);
    } else {
       toast({ title: 'Operation Not Allowed', description: 'This operation is not permitted for this staff member or action type.', variant: 'destructive' });
    }

    if (result?.success) {
      toast({ title: 'Success', description: result.message, duration: 7000 });
      fetchStaff(); 
    } else if (result) {
      toast({ title: 'Error', description: result.message || "An unknown error occurred.", variant: 'destructive', duration: 7000 });
    }
    setIsProcessing(false);
    setDialogActionType(null); 
    setStaffToProcess(null);
  };
  
  const getDialogDetails = () => {
    if (!staffToProcess || !dialogActionType) return { title: '', description: '', actionText: '', actionVariant: 'default' as const };
    if (dialogActionType === 'delete') {
      return {
        title: 'Are you absolutely sure?',
        description: `This action will attempt to delete the staff member "${staffToProcess.name}", their authentication account, and their user record via Cloud Function. This cannot be undone.`,
        actionText: 'Delete Staff Member',
        actionVariant: "destructive" as const,
      };
    }
    if (dialogActionType === 'toggleStatus') {
      const action = staffToProcess.isDisabled ? "Enable" : "Disable";
      return {
        title: `Confirm Account Status Change`,
        description: `Are you sure you want to ${action.toLowerCase()} the account for "${staffToProcess.name}"? This will affect their ability to log in.`,
        actionText: action,
        actionVariant: staffToProcess.isDisabled ? "default" : "destructive" as const,
      };
    }
    return { title: '', description: '', actionText: '', actionVariant: 'default' as const };
  };

  const { title: dialogTitle, description: dialogDescription, actionText: dialogActionText, actionVariant: dialogActionVariant } = getDialogDetails();

  const getDepartmentPill = (departmentName: string) => {
    const deptConfig = STAFF_DEPARTMENTS_CONFIG[departmentName];
    if (!deptConfig) {
      return <Badge variant="secondary">{departmentName}</Badge>;
    }
    return (
      <Badge style={{ backgroundColor: deptConfig.color, color: deptConfig.textColor || 'hsl(0, 0%, 100%)' }} className="border-transparent">
        {deptConfig.name}
      </Badge>
    );
  };


  return (
    <TooltipProvider>
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center"><UsersRound className="mr-2 h-6 w-6 text-accent" /> Staff Hub</CardTitle>
            <CardDescription>Manage staff members, their departments, and account status.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/staff/create">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Staff
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingStaff ? (
            <div className="flex justify-center items-center py-10">
              <LottieLoader size={48} />
              <p className="ml-2">Loading staff members...</p>
            </div>
          ) : staffMembers.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No staff members found. Add your first staff member!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffMembers.map((staff) => (
                  <TableRow 
                    key={staff.id} 
                    className={cn(staff.isDisabled && 'opacity-60 bg-muted/50')}
                  >
                    <TableCell className="font-medium">{staff.name}</TableCell>
                    <TableCell>{staff.email}</TableCell>
                    <TableCell>{getDepartmentPill(staff.department)}</TableCell>
                    <TableCell>{staff.phone || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${staff.isDisabled ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {staff.isDisabled ? 'Disabled' : 'Active'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" asChild>
                                <Link href={`/admin/staff/edit/${staff.id}`} title="Edit Staff Member">
                                    <Edit3 className="h-4 w-4" />
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Edit Staff Member</p></TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                title={staff.isDisabled ? "Enable Account" : "Disable Account"} 
                                onClick={() => openDialog(staff, 'toggleStatus')}
                                disabled={!staff.authUid} 
                            >
                                {staff.isDisabled ? <UserCheck className="h-4 w-4 text-green-600" /> : <UserX className="h-4 w-4 text-orange-600" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{!staff.authUid ? "No linked Auth account" : (staff.isDisabled ? "Enable Account" : "Disable Account")}</p></TooltipContent>
                      </Tooltip>

                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  title="Delete Staff Member" 
                                  onClick={() => openDialog(staff, 'delete')} 
                              >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Delete Staff Member & Account</p></TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {staffToProcess && dialogActionType && (
        <AlertDialog open={!!staffToProcess} onOpenChange={(isOpen) => {if (!isOpen) {setStaffToProcess(null); setDialogActionType(null);}}}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center">
                   <ShieldAlert className={cn("mr-2 h-5 w-5", dialogActionVariant === "destructive" ? "text-destructive" : "text-primary" )}/> 
                   {dialogTitle}
                </AlertDialogTitle>
                <AlertDialogDescription>
                    {dialogDescription}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {setStaffToProcess(null); setDialogActionType(null);}} disabled={isProcessing}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleDialogAction}
                    disabled={isProcessing}
                     className={cn(
                        dialogActionVariant === 'destructive' && 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
                        dialogActionVariant === 'default' && 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    )}
                >
                {isProcessing ? <LottieLoader className="mr-2" size={16} /> : null}
                {isProcessing ? (dialogActionType === 'delete' ? 'Deleting...' : (staffToProcess.isDisabled ? 'Enabling...' : 'Disabling...')) : dialogActionText}
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
    </TooltipProvider>
  );
};

export default StaffHubPage;

    