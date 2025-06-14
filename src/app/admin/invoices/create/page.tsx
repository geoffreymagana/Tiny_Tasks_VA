
"use client";

import type { FC } from 'react';
// Basic shell for now, will be fleshed out in the next phase.
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const CreateInvoicePage: FC = () => {
  return (
    <div>
      <Button variant="outline" asChild className="mb-6">
        <Link href="/admin/invoices">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices Hub
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Create New Invoice</CardTitle>
          <CardDescription>Fill in the details to create a new invoice. Full form coming soon!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Invoice creation form with itemized entries, client selection, date pickers, and auto-calculations will be implemented here.</p>
          {/* Placeholder for form */}
          <div className="mt-6 space-x-2">
            <Button disabled>Save as Draft (Coming Soon)</Button>
            <Button disabled>Save & Send Invoice (Coming Soon)</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateInvoicePage;
