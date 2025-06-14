
"use client";

import type { FC } from 'react';
// Basic shell for now, will be fleshed out in a later phase.
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';

const ViewInvoicePage: FC = () => {
  const params = useParams();
  const invoiceId = params.invoiceId as string;

  return (
    <div>
      <Button variant="outline" asChild className="mb-6">
        <Link href="/admin/invoices">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices Hub
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>View Invoice {invoiceId ? `(#${invoiceId.substring(0,6)}...)` : ''}</CardTitle>
          <CardDescription>Details of the invoice. Printable view coming soon!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">A detailed view of the invoice will be displayed here (ID: {invoiceId}).</p>
          {/* Placeholder for invoice details display */}
          <div className="mt-6 space-x-2">
            <Button disabled>Print Invoice (Coming Soon)</Button>
            <Button disabled>Download PDF (Coming Soon)</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewInvoicePage;
