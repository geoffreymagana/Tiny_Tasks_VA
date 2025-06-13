
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
import { getAllClientsAction, deleteClientAction, type Client, type ClientOperationResult } from './actions';
import { LottieLoader } from '@/components/ui/lottie-loader';
import { PlusCircle, Users, Edit3, Trash2, Briefcase, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ClientHubPage: FC = () => {
  const { toast } = useToast();
  const { user: firebaseUser } = useAdminAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

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

  const handleDeleteClient = async (clientId: string) => {
    if (!firebaseUser?.uid) {
      toast({ title: 'Authentication Error', description: 'Admin not authenticated.', variant: 'destructive' });
      return;
    }
    if (!clientToDelete || clientToDelete.id !== clientId || clientToDelete.source === 'users') {
        toast({ title: 'Operation Not Allowed', description: 'This client cannot be deleted from here.', variant: 'destructive' });
        setClientToDelete(null);
        return;
    }

    setIsDeletingClient(true);
    const result: ClientOperationResult = await deleteClientAction(clientId, firebaseUser.uid);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
      setClients(prevClients => prevClients.filter(client => client.id !== clientId));
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
    setIsDeletingClient(false);
    setClientToDelete(null);
  };

  const openDeleteDialog = (client: Client) => {
    if (client.source === 'users') {
        toast({
            title: "Deletion Not Allowed",
            description: "Clients synced from user accounts cannot be deleted here. Manage user accounts separately.",
            variant: "default",
            duration: 5000,
        });
        return;
    }
    setClientToDelete(client);
  };

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
                  <TableHead>Projects (soon)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} className={client.source === 'users' ? 'bg-secondary/30' : ''}>
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
                                asChild={client.source === 'clients'} // asChild only if it's a Link
                                disabled={client.source === 'users'}
                            >
                                {client.source === 'clients' ? (
                                    <Link href={`/admin/clients/edit/${client.id}`} title="Edit Client">
                                        <Edit3 className="h-4 w-4" />
                                    </Link>
                                ) : (
                                    <Edit3 className="h-4 w-4" /> // Just the icon if disabled
                                )}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{client.source === 'clients' ? 'Edit Client' : 'Editing synced users not available here'}</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <AlertDialog open={!!clientToDelete && clientToDelete.id === client.id} onOpenChange={(isOpen) => !isOpen && setClientToDelete(null)}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span>
                                    <AlertDialogTrigger asChild disabled={client.source === 'users'}>
                                        <Button variant="ghost" size="icon" title="Delete Client" onClick={() => openDeleteDialog(client)} disabled={client.source === 'users'}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </AlertDialogTrigger>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{client.source === 'clients' ? 'Delete Client' : 'Synced users cannot be deleted here'}</p>
                            </TooltipContent>
                        </Tooltip>
                        {client.source === 'clients' && clientToDelete?.id === client.id && ( // Ensure content is only for the correct dialog
                            <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the client &quot;{client.name}&quot; from the manually added list.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setClientToDelete(null)} disabled={isDeletingClient}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                onClick={() => handleDeleteClient(client.id)}
                                disabled={isDeletingClient}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                >
                                {isDeletingClient ? <LottieLoader className="mr-2" size={16} /> : 'Delete'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        )}
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
};

export default ClientHubPage;

