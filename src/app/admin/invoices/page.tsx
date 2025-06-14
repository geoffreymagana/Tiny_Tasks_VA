
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
import { getAllInvoicesAction, deleteInvoiceAction, sendInvoiceAction } from './actions'; // Removed type Invoice, InvoiceStatus from here
import type { Invoice, InvoiceStatus, InvoiceOperationResult } from './schema'; // Import types from schema
import { LottieLoader } from '@/components/ui/lottie-loader';
import { PlusCircle, Receipt, Edit3, Trash2, Send, MoreVertical, Circle, EyeIcon, ShieldAlert } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const statusColors: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-400',
  pending: 'bg-yellow-500',
  paid: 'bg-green-500',
  overdue: 'bg-red-600',
  void: 'bg-neutral-500',
};

const statusTextColors: Record<InvoiceStatus, string> = {
  draft: 'text-gray-800',
  pending: 'text-yellow-800',
  paid: 'text-white',
  overdue: 'text-white',
  void: 'text-white',
}

const statusTooltips: Record<InvoiceStatus, string> = {
  draft: 'Invoice is a draft and not yet sent.',
  pending: 'Invoice sent, awaiting payment.',
  paid: 'Invoice has been paid.',
  overdue: 'Payment for this invoice is overdue.',
  void: 'This invoice has been voided/cancelled.',
};


const InvoicesHubPage: FC = () => {
  const { toast } = useToast();
  const { user: firebaseUser } = useAdminAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [invoiceToProcess, setInvoiceToProcess] = useState<Invoice | null>(null);
  const [dialogActionType, setDialogActionType] = useState<'delete' | 'send' | null>(null);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedInvoices = await getAllInvoicesAction();
      setInvoices(fetchedInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({ title: "Error", description: "Could not fetch invoices.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (firebaseUser) {
        fetchInvoices();
    }
  }, [firebaseUser, fetchInvoices]);

  const openDialog = (invoice: Invoice, actionType: 'delete' | 'send') => {
    setInvoiceToProcess(invoice);
    setDialogActionType(actionType);
  };

  const handleDialogAction = async () => {
    if (!invoiceToProcess || !firebaseUser?.uid || !dialogActionType) {
      toast({ title: 'Error', description: 'Action cannot be performed.', variant: 'destructive'});
      setInvoiceToProcess(null);
      setDialogActionType(null);
      return;
    }
    setIsProcessing(true);
    let result: InvoiceOperationResult | null = null;

    if (dialogActionType === 'delete') {
      result = await deleteInvoiceAction(invoiceToProcess.id!, firebaseUser.uid);
    } else if (dialogActionType === 'send') {
      result = await sendInvoiceAction(invoiceToProcess.id!, firebaseUser.uid);
    }

    if (result?.success) {
      toast({ title: 'Success', description: result.message });
      fetchInvoices(); 
    } else {
      toast({ title: 'Error', description: result?.message || "An unknown error occurred.", variant: 'destructive' });
    }
    setIsProcessing(false);
    setInvoiceToProcess(null);
    setDialogActionType(null);
  };
  
  const getDialogDetails = () => {
    if (!invoiceToProcess || !dialogActionType) return { title: '', description: '', actionText: '', actionVariant: 'default' as const };
    if (dialogActionType === 'delete') {
      return {
        title: `Delete Invoice ${invoiceToProcess.invoiceNumber}?`,
        description: `This will permanently delete the invoice. This action cannot be undone.`,
        actionText: 'Delete Invoice',
        actionVariant: "destructive" as const,
      };
    }
    if (dialogActionType === 'send') {
      return {
        title: `Send Invoice ${invoiceToProcess.invoiceNumber}?`,
        description: `This will simulate sending the invoice to ${invoiceToProcess.clientEmail || invoiceToProcess.clientName}. The status will be updated to 'Pending' if it's currently 'Draft'.`,
        actionText: 'Send Invoice',
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
              <CardTitle className="flex items-center"><Receipt className="mr-2 h-6 w-6 text-accent" /> Invoices Hub</CardTitle>
              <CardDescription>Manage all your client invoices.</CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/invoices/create">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Invoice
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <LottieLoader size={48} />
                <p className="ml-2">Loading invoices...</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Receipt className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">No invoices found.</p>
                <p className="text-sm text-muted-foreground mb-6">Get started by creating your first invoice.</p>
                <Button asChild>
                  <Link href="/admin/invoices/create">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create New Invoice
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.clientName}</TableCell>
                      <TableCell>{format(parseISO(invoice.issueDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(parseISO(invoice.dueDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-right">KES {invoice.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge className={cn("capitalize border text-xs", statusColors[invoice.status], statusTextColors[invoice.status])}>
                                {invoice.status}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{statusTooltips[invoice.status]}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Invoice Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/invoices/view/${invoice.id}`}>
                                <EyeIcon className="mr-2 h-4 w-4" /> View Invoice
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/invoices/edit/${invoice.id}`}>
                                <Edit3 className="mr-2 h-4 w-4" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            {(invoice.status === 'draft' || invoice.status === 'pending' || invoice.status === 'overdue') && (
                              <DropdownMenuItem onClick={() => openDialog(invoice, 'send')}>
                                <Send className="mr-2 h-4 w-4" /> 
                                {invoice.status === 'draft' ? 'Send Invoice' : 'Resend Invoice'}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => openDialog(invoice, 'delete')}
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

        {invoiceToProcess && dialogActionType && (
          <AlertDialog open={!!invoiceToProcess} onOpenChange={(isOpen) => {if (!isOpen) {setInvoiceToProcess(null); setDialogActionType(null);}}}>
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
                  <AlertDialogCancel onClick={() => {setInvoiceToProcess(null); setDialogActionType(null);}} disabled={isProcessing}>Cancel</AlertDialogCancel>
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

export default InvoicesHubPage;
