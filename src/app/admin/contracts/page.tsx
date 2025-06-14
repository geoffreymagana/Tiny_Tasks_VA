
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { getAllContractsAction, deleteContractAction, sendContractAction } from './actions';
import type { Contract, ContractStatus, ContractOperationResult } from './schema';
import { LottieLoader } from '@/components/ui/lottie-loader';
import { PlusCircle, FileText as FileTextIcon, Edit3, Trash2, Send, MoreVertical, EyeIcon, ShieldAlert } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const statusColors: Record<ContractStatus, string> = {
  draft: 'bg-gray-400 text-gray-800',
  pending_signature: 'bg-yellow-500 text-yellow-800',
  active: 'bg-green-500 text-white',
  expired: 'bg-blue-500 text-white',
  terminated: 'bg-red-600 text-white',
  template: 'bg-purple-500 text-white',
};

const statusTooltips: Record<ContractStatus, string> = {
  draft: 'Contract is a draft and not yet finalized.',
  pending_signature: 'Contract sent, awaiting client signature.',
  active: 'Contract is active and in effect.',
  expired: 'Contract has passed its expiration date.',
  terminated: 'Contract has been terminated.',
  template: 'This is a contract template.',
};

const ContractsHubPage: FC = () => {
  const { toast } = useToast();
  const { user: firebaseUser } = useAdminAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [contractToProcess, setContractToProcess] = useState<Contract | null>(null);
  const [dialogActionType, setDialogActionType] = useState<'delete' | 'send' | null>(null);

  const fetchContracts = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedContracts = await getAllContractsAction();
      setContracts(fetchedContracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      toast({ title: "Error", description: "Could not fetch contracts.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (firebaseUser) {
        fetchContracts();
    }
  }, [firebaseUser, fetchContracts]);

  const openDialog = (contract: Contract, actionType: 'delete' | 'send') => {
    if (contract.isTemplate && actionType === 'send') {
        toast({ title: "Action Not Applicable", description: "Cannot send a template directly. Create a contract from it first.", variant: "default" });
        return;
    }
    setContractToProcess(contract);
    setDialogActionType(actionType);
  };

  const handleDialogAction = async () => {
    if (!contractToProcess || !firebaseUser?.uid || !dialogActionType) {
      toast({ title: 'Error', description: 'Action cannot be performed.', variant: 'destructive'});
      setContractToProcess(null);
      setDialogActionType(null);
      return;
    }
    setIsProcessing(true);
    let result: ContractOperationResult | null = null;

    if (dialogActionType === 'delete') {
      result = await deleteContractAction(contractToProcess.id!, firebaseUser.uid);
    } else if (dialogActionType === 'send') {
      result = await sendContractAction(contractToProcess.id!, firebaseUser.uid);
    }

    if (result?.success) {
      toast({ title: 'Success', description: result.message });
      fetchContracts(); 
    } else {
      toast({ title: 'Error', description: result?.message || "An unknown error occurred.", variant: 'destructive' });
    }
    setIsProcessing(false);
    setContractToProcess(null);
    setDialogActionType(null);
  };
  
  const getDialogDetails = () => {
    if (!contractToProcess || !dialogActionType) return { title: '', description: '', actionText: '', actionVariant: 'default' as const };
    if (dialogActionType === 'delete') {
      return {
        title: `Delete Contract ${contractToProcess.contractNumber || contractToProcess.title}?`,
        description: `This will permanently delete the contract. This action cannot be undone.`,
        actionText: 'Delete Contract',
        actionVariant: "destructive" as const,
      };
    }
    if (dialogActionType === 'send') {
      return {
        title: `Send Contract ${contractToProcess.contractNumber || contractToProcess.title}?`,
        description: `This will simulate sending the contract to ${contractToProcess.clientName || 'the client'}. The status will be updated if it's currently 'Draft'.`,
        actionText: 'Send Contract',
        actionVariant: "default" as const,
      };
    }
    return { title: '', description: '', actionText: '', actionVariant: 'default' as const };
  };

  const { title: dialogTitle, description: dialogDescription, actionText: dialogActionText, actionVariant: dialogActionVariant } = getDialogDetails();

  return (
    <TooltipProvider>
      <div className="space-y-8 h-full flex flex-col">
        <Card className="flex-grow flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center"><FileTextIcon className="mr-2 h-6 w-6 text-accent" /> Contracts Hub</CardTitle>
              <CardDescription>Manage all client and template contracts.</CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/contracts/create">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Contract
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <LottieLoader size={48} />
                <p className="ml-2">Loading contracts...</p>
              </div>
            ) : contracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FileTextIcon className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">No contracts found.</p>
                <p className="text-sm text-muted-foreground mb-6">Get started by creating your first contract or template.</p>
                <Button asChild>
                  <Link href="/admin/contracts/create">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create New Contract
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number / Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id} className={cn(contract.isTemplate && 'bg-purple-500/10 hover:bg-purple-500/20')}>
                      <TableCell className="font-medium">
                        <div>{contract.contractNumber}</div>
                        <div className="text-xs text-muted-foreground">{contract.isTemplate ? contract.templateName : contract.title}</div>
                      </TableCell>
                      <TableCell>{contract.isTemplate ? <Badge variant="outline">Template</Badge> : (contract.clientName || 'N/A')}</TableCell>
                      <TableCell>{format(parseISO(contract.effectiveDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge className={cn("capitalize border text-xs", statusColors[contract.status])}>
                                {contract.status.replace('_', ' ')}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{statusTooltips[contract.status]}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Contract Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/contracts/view/${contract.id}`}>
                                <EyeIcon className="mr-2 h-4 w-4" /> View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/contracts/edit/${contract.id}`}>
                                <Edit3 className="mr-2 h-4 w-4" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            {!contract.isTemplate && (contract.status === 'draft' || contract.status === 'pending_signature') && (
                              <DropdownMenuItem onClick={() => openDialog(contract, 'send')}>
                                <Send className="mr-2 h-4 w-4" /> 
                                {contract.status === 'draft' ? 'Send Contract' : 'Resend Contract'}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => openDialog(contract, 'delete')}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {contractToProcess && dialogActionType && (
          <AlertDialog open={!!contractToProcess} onOpenChange={(isOpen) => {if (!isOpen) {setContractToProcess(null); setDialogActionType(null);}}}>
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
                  <AlertDialogCancel onClick={() => {setContractToProcess(null); setDialogActionType(null);}} disabled={isProcessing}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                      onClick={handleDialogAction}
                      disabled={isProcessing}
                      className={cn(
                          dialogActionVariant === 'destructive' && 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
                          dialogActionVariant === 'default' && 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      )}
                  >
                  {isProcessing ? <LottieLoader className="mr-2" size={16} /> : null}
                  {isProcessing ? (dialogActionType === 'delete' ? 'Deleting...' : 'Sending...') : dialogActionText}
                  </AlertDialogAction>
              </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </TooltipProvider>
  );
};

export default ContractsHubPage;
