
"use client";

import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { getInvoiceAction } from '../../actions'; // Corrected import path
import type { Invoice, InvoiceStatus } from '../../schema'; // Corrected import path
import { LottieLoader } from '@/components/ui/lottie-loader';
import { ArrowLeft, Printer, Edit, Send, Trash2, DollarSign, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const statusColors: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-400 text-gray-800 border-gray-500',
  pending: 'bg-yellow-400 text-yellow-800 border-yellow-500',
  paid: 'bg-green-500 text-white border-green-600',
  overdue: 'bg-red-500 text-white border-red-600',
  void: 'bg-neutral-500 text-white border-neutral-600',
};

const ViewInvoicePage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const invoiceId = params.invoiceId as string;
  const { user: adminFirebaseUser } = useAdminAuth();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvoice = useCallback(async () => {
    if (!invoiceId) return;
    setIsLoading(true);
    try {
      const fetchedInvoice = await getInvoiceAction(invoiceId);
      if (fetchedInvoice) {
        setInvoice(fetchedInvoice);
      } else {
        toast({ title: "Error", description: "Invoice not found.", variant: "destructive" });
        router.push('/admin/invoices');
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      toast({ title: "Error", description: "Could not fetch invoice details.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId, toast, router]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (isLoading || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <LottieLoader size={64} />
        <p className="mt-4 text-lg text-muted-foreground">Loading invoice details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center print:hidden">
        <Button variant="outline" asChild>
          <Link href="/admin/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices Hub
          </Link>
        </Button>
        <div className="space-x-2">
            <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
            </Button>
            <Button variant="outline" asChild>
                <Link href={`/admin/invoices/edit/${invoice.id}`}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                </Link>
            </Button>
             {/* More actions like 'Send Invoice' can be added here */}
        </div>
      </div>

      <Card className="shadow-lg print:shadow-none print:border-none" id="invoice-to-print">
        <CardHeader className="bg-muted/30 p-6 print:bg-transparent">
          <div className="flex flex-col sm:flex-row justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-primary">INVOICE</h1>
              <p className="text-muted-foreground">Invoice #: {invoice.invoiceNumber}</p>
            </div>
            <div className="text-left sm:text-right mt-4 sm:mt-0">
              <h2 className="text-xl font-semibold text-primary">Tiny Tasks VA Services</h2>
              <p className="text-sm text-muted-foreground">yourcompany@example.com</p>
              <p className="text-sm text-muted-foreground">+254 700 000 000</p>
              <p className="text-sm text-muted-foreground">Nairobi, Kenya</p>
            </div>
          </div>
          <Separator className="my-4 print:hidden" />
           <div className="flex flex-col sm:flex-row justify-between items-start text-sm">
                <div>
                    <p className="font-semibold text-muted-foreground">Bill To:</p>
                    <p className="text-primary font-medium">{invoice.clientName}</p>
                    <p>{invoice.clientEmail}</p>
                    {/* Add client address if available */}
                </div>
                <div className="text-left sm:text-right mt-4 sm:mt-0">
                    <p><span className="font-semibold text-muted-foreground">Issue Date:</span> {format(parseISO(invoice.issueDate), 'PPP')}</p>
                    <p><span className="font-semibold text-muted-foreground">Due Date:</span> {format(parseISO(invoice.dueDate), 'PPP')}</p>
                    <Badge variant="outline" className={cn("mt-2 text-sm px-3 py-1", statusColors[invoice.status])}>
                        Status: {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 print:bg-gray-100">
                <TableHead className="w-[50%]">Description</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Unit Price (KES)</TableHead>
                <TableHead className="text-right">Total (KES)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, index) => (
                <TableRow key={item.id || index}>
                  <TableCell className="font-medium">{item.description}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">{item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{(item.quantity * item.unitPrice).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">KES {invoice.subTotalAmount.toFixed(2)}</span>
                </div>
                {invoice.taxAmount > 0 && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax:</span>
                        <span className="font-medium">KES {invoice.taxAmount.toFixed(2)}</span>
                    </div>
                )}
                {invoice.discountAmount > 0 && (
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount:</span>
                        <span className="font-medium text-destructive">- KES {invoice.discountAmount.toFixed(2)}</span>
                    </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold text-primary">
                    <span>Total Amount Due:</span>
                    <span>KES {invoice.totalAmount.toFixed(2)}</span>
                </div>
            </div>
          </div>
        </CardContent>
        {(invoice.notes || invoice.status === 'paid') && (
            <CardFooter className="p-6 border-t bg-muted/20 print:border-t print:bg-transparent">
                <div className="space-y-3 text-sm">
                    {invoice.status === 'paid' && invoice.paidAt && (
                        <div className="flex items-center text-green-600">
                            <DollarSign className="mr-2 h-5 w-5" />
                            <span>Paid on: {format(parseISO(invoice.paidAt as string), 'PPP')}</span>
                        </div>
                    )}
                    {invoice.notes && (
                        <div>
                            <h4 className="font-semibold text-muted-foreground mb-1">Notes:</h4>
                            <p className="text-foreground/80 whitespace-pre-wrap">{invoice.notes}</p>
                        </div>
                    )}
                </div>
            </CardFooter>
        )}
      </Card>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-to-print, #invoice-to-print * {
            visibility: visible;
          }
          #invoice-to-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            border: none;
            box-shadow: none;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:bg-transparent {
            background-color: transparent !important;
          }
           .print\\:bg-gray-100 {
            background-color: #f3f4f6 !important; /* Example gray for print header consistency */
          }
           .print\\:border-none {
            border: none !important;
          }
           .print\\:border-t {
            border-top-width: 1px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ViewInvoicePage;

