
"use client";

import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { getAllClientsAction, deleteClientAction, toggleUserAccountDisabledStatusAction, type Client, type ClientOperationResult } from './actions';
import { LottieLoader } from '@/components/ui/lottie-loader';
import { PlusCircle, Users, Edit3, Trash2, Briefcase, UserX, UserCheck, ShieldAlert, Badge } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const ClientHubPage: FC = () => {
  const { toast } = useToast();
  const { user: firebaseUser } = useAdminAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); // General processing state for delete/toggle
  const [clientToProcess, setClientToProcess] = useState<Client | null>(null);
  const [dialogActionType, setDialogActionType] = useState<'delete' | 'toggleStatus' | null>(null);


  const fetchClients = useCallback(async () => {
    setIsLoadingClients(true);
    try {
      const fetchedClients = await getAllClientsAction();
      setClients(fetchedClients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({ title: "Error", description: "Could not fetch clients.", variant: "destructive" });
    } finally {
      setIsLoadingClients(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const openDialog = (client: Client, actionType: 'delete' | 'toggleStatus') => {
    if (actionType === 'delete' && client.source === 'users') {
        toast({
            title: "Deletion Not Allowed",
            description: "Clients synced from user accounts cannot be deleted here. Manage user accounts separately.",
            variant: "default",
            duration: 5000,
        });
        return;
    }
    setClientToProcess(client);
    setDialogActionType(actionType);
  };

  const handleDialogAction = async () => {
    if (!clientToProcess || !firebaseUser?.uid || !dialogActionType) {
      toast({ title: 'Error', description: 'Action cannot be performed.', variant: 'destructive'});
      setClientToProcess(null);
      setDialogActionType(null);
      return;
    }
    setIsProcessing(true);
    let result: ClientOperationResult | null = null;

    if (dialogActionType === 'delete' && clientToProcess.source === 'clients') {
      result = await deleteClientAction(clientToProcess.id, firebaseUser.uid);
    } else if (dialogActionType === 'toggleStatus' && clientToProcess.source === 'users') {
      result = await toggleUserAccountDisabledStatusAction(clientToProcess.id, firebaseUser.uid);
    } else {
       toast({ title: 'Operation Not Allowed', description: 'This operation is not permitted for this client type.', variant: 'destructive' });
       setIsProcessing(false);
       setClientToProcess(null);
       setDialogActionType(null);
       return;
    }

    if (result?.success) {
      toast({ title: 'Success', description: result.message });
      fetchClients(); // Refresh client list
    } else {
      toast({ title: 'Error', description: result?.message || "An unknown error occurred.", variant: 'destructive' });
    }
    setIsProcessing(false);
    setClientToProcess(null);
    setDialogActionType(null);
  };

  const getDialogDetails = () => {
    if (!clientToProcess || !dialogActionType) return { title: '', description: '', actionText: '' };
    if (dialogActionType === 'delete') {
      return {
        title: 'Are you absolutely sure?',
        description: `This action cannot be undone. This will permanently delete the client "${clientToProcess.name}" from the manually added list.`,
        actionText: 'Delete',
        actionVariant: "destructive" as "destructive" | "default" | "outline" | "secondary" | "ghost" | "link" | null | undefined,
      };
    }
    if (dialogActionType === 'toggleStatus') {
      const action = clientToProcess.isDisabled ? "Enable" : "Disable";
      return {
        title: `Confirm Account Status Change`,
        description: `Are you sure you want to ${action.toLowerCase()} the account for "${clientToProcess.name}"? This will affect their ability to access services.`,
        actionText: action,
        actionVariant: clientToProcess.isDisabled ? "default" : "destructive" as "destructive" | "default" | "outline" | "secondary" | "ghost" | "link" | null | undefined,
      };
    }
    return { title: '', description: '', actionText: '' };
  };

  const { title: dialogTitle, description: dialogDescription, actionText: dialogActionText, actionVariant: dialogActionVariant } = getDialogDetails();

  return (
    <TooltipProvider>
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center"><Users className="mr-2 h-6 w-6 text-accent" /> Client Hub</CardTitle>
            <CardDescription>Manage client information. Clients from user sign-ups and manual additions are shown.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/clients/create">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Client
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingClients ? (
            <div className="flex justify-center items-center py-10">
              <LottieLoader size={48} />
              <p className="ml-2">Loading clients...</p>
            </div>
          ) : clients.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No clients found. Add your first client or check user sign-ups!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Projects (soon)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow 
                    key={client.id} 
                    className={cn(
                        client.source === 'users' ? 'bg-secondary/30' : '',
                        client.isDisabled && 'opacity-60 bg-muted/50'
                    )}
                  >
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.company || '-'}</TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${client.source === 'clients' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {client.source === 'clients' ? 'Manual' : 'User Account'}
                        </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${client.isDisabled ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {client.isDisabled ? 'Disabled' : 'Active'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" disabled>
                        <Briefcase className="mr-1 h-3 w-3" /> View (0)
                      </Button>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span> 
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                asChild={client.source === 'clients'}
                                disabled={client.source === 'users'}
                            >
                                {client.source === 'clients' ? (
                                    <Link href={`/admin/clients/edit/${client.id}`} title="Edit Client">
                                        <Edit3 className="h-4 w-4" />
                                    </Link>
                                ) : (
                                    <Edit3 className="h-4 w-4" /> 
                                )}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{client.source === 'clients' ? 'Edit Client' : 'Editing synced users not available here'}</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      {client.source === 'users' && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    title={client.isDisabled ? "Enable Account" : "Disable Account"} 
                                    onClick={() => openDialog(client, 'toggleStatus')}
                                >
                                    {client.isDisabled ? <UserCheck className="h-4 w-4 text-green-600" /> : <UserX className="h-4 w-4 text-orange-600" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{client.isDisabled ? "Enable User Account" : "Disable User Account"}</p>
                            </TooltipContent>
                        </Tooltip>
                      )}

                      <Tooltip>
                          <TooltipTrigger asChild>
                              <span>
                                  <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      title="Delete Client" 
                                      onClick={() => openDialog(client, 'delete')} 
                                      disabled={client.source === 'users'}
                                  >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                              </span>
                          </TooltipTrigger>
                          <TooltipContent>
                              <p>{client.source === 'clients' ? 'Delete Client' : 'Synced users cannot be deleted here'}</p>
                          </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {clientToProcess && dialogActionType && (
        <AlertDialog open={!!clientToProcess} onOpenChange={(isOpen) => {if (!isOpen) {setClientToProcess(null); setDialogActionType(null);}}}>
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
                <AlertDialogCancel onClick={() => {setClientToProcess(null); setDialogActionType(null);}} disabled={isProcessing}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleDialogAction}
                    disabled={isProcessing}
                    className={cn(
                        dialogActionVariant === 'destructive' && 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
                        dialogActionVariant === 'default' && 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    )}
                >
                {isProcessing ? <LottieLoader className="mr-2" size={16} /> : dialogActionText}
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
    </TooltipProvider>
  );
};

export default ClientHubPage;

    