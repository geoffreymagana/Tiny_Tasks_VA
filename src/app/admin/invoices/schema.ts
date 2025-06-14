
import { z } from 'zod';

// ----- Data Structures -----
export const InvoiceItemSchema = z.object({
  id: z.string().optional(), // For client-side keying, not necessarily stored in Firestore if items are subcollection
  description: z.string().min(1, "Item description is required."),
  quantity: z.number().min(0.01, "Quantity must be greater than 0."),
  unitPrice: z.number().min(0, "Unit price cannot be negative."),
  // total will be calculated: quantity * unitPrice
});
export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

export const InvoiceStatusSchema = z.enum(['draft', 'pending', 'paid', 'overdue', 'void']);
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;

export const InvoiceSchema = z.object({
  id: z.string().optional(),
  invoiceNumber: z.string(),
  clientId: z.string().min(1, "Client selection is required."),
  clientName: z.string().min(1, "Client name is required."), // Denormalized for display
  clientEmail: z.string().email("Invalid client email.").optional().nullable(), // Denormalized for display/sending
  issueDate: z.string().refine((date) => !isNaN(new Date(date).getTime()), "Invalid issue date"),
  dueDate: z.string().refine((date) => !isNaN(new Date(date).getTime()), "Invalid due date"),
  items: z.array(InvoiceItemSchema).min(1, "At least one item is required."),
  totalAmount: z.number(),
  status: InvoiceStatusSchema,
  notes: z.string().optional().nullable(),
  adminId: z.string(), // UID of the admin who created/manages it
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  paidAt: z.any().optional().nullable(),
});
export type Invoice = z.infer<typeof InvoiceSchema>;
