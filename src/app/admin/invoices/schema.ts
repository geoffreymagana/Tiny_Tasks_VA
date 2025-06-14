
import { z } from 'zod';

// ----- Data Structures -----
export const InvoiceItemSchema = z.object({
  id: z.string().optional(), 
  description: z.string().min(1, "Item description is required.").max(200, "Description too long."),
  quantity: z.number().min(0.01, "Quantity must be greater than 0.").max(10000, "Quantity too large."),
  unitOfMeasure: z.string().max(20, "Unit of measure too long.").optional().or(z.literal('')),
  unitPrice: z.number().min(0, "Unit price cannot be negative.").max(1000000, "Unit price too large."),
});
export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

export const InvoiceStatusSchema = z.enum(['draft', 'pending', 'paid', 'overdue', 'void']);
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;

export const InvoiceSchema = z.object({
  id: z.string().optional(), 
  invoiceNumber: z.string().min(1, "Invoice number is required."),
  
  senderName: z.string().min(2, "Sender name is required.").max(100).optional().nullable(),
  senderEmail: z.string().email("Invalid sender email.").max(100).optional().nullable(),
  senderPhone: z.string().max(30).optional().nullable(),
  senderAddress: z.string().max(200, "Sender address too long.").optional().nullable(),

  clientId: z.string().min(1, "Client selection is required."),
  clientName: z.string().min(1, "Client name is required for the invoice."), 
  clientEmail: z.string().email("Invalid client email for the invoice.").optional().nullable(), 
  
  issueDate: z.string().refine((date) => !isNaN(new Date(date).getTime()), "Invalid issue date"),
  dueDate: z.string().refine((date) => !isNaN(new Date(date).getTime()), "Invalid due date"),
  
  items: z.array(InvoiceItemSchema)
    .min(1, "At least one item is required.")
    .max(50, "Maximum 50 items per invoice."),
  
  subTotalAmount: z.number().min(0, "Subtotal cannot be negative."),
  taxAmount: z.number().min(0, "Tax amount cannot be negative.").optional().default(0), 
  discountAmount: z.number().min(0, "Discount amount cannot be negative.").optional().default(0),
  totalAmount: z.number().min(0, "Total amount cannot be negative."),
  
  status: InvoiceStatusSchema,
  notes: z.string().max(1000, "Notes too long.").optional().nullable(),
  
  adminId: z.string().min(1, "Admin ID is required."),
  createdAt: z.any().optional(), 
  updatedAt: z.any().optional(), 
  paidAt: z.any().optional().nullable(), 
});
export type Invoice = z.infer<typeof InvoiceSchema>;

export const CreateInvoiceFormSchema = InvoiceSchema.omit({
    id: true,
    invoiceNumber: true, 
    adminId: true, 
    createdAt: true,
    updatedAt: true,
    paidAt: true,
    subTotalAmount: true, 
    taxAmount: true, // taxAmount is calculated from taxRate, so it's not directly in form
    totalAmount: true, 
}).extend({
  issueDate: z.date({ required_error: "Issue date is required."}),
  dueDate: z.date({ required_error: "Due date is required."}),
  senderName: z.string().min(2, "Your company/name is required.").max(100),
  senderEmail: z.string().email("A valid sender email is required.").max(100),
  senderPhone: z.string().max(30).optional().or(z.literal('')),
  senderAddress: z.string().max(200, "Sender address too long.").optional().or(z.literal('')),
  items: z.array(
    InvoiceItemSchema.extend({
        unitOfMeasure: z.string().max(20, "Unit too long").optional().default(''),
    })
  ).min(1, "At least one item is required.").max(50, "Maximum 50 items per invoice."),
  taxRate: z.number().min(0, "Tax rate cannot be negative.").max(100, "Tax rate cannot exceed 100%.").optional().default(0),
  discountAmount: z.number().min(0, "Discount cannot be negative.").optional().default(0),
});

export type CreateInvoiceFormValues = z.infer<typeof CreateInvoiceFormSchema>;
