export interface CompanyBillingInfo {
  companyName: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  paymentMethod: string | null;
}

export interface InvoiceRow {
  id: string | number;
  invoiceNumber?: string;
  subtotal?: number;
  tax_amount?: number;
  total?: number;
  currency?: string;
  status?: string;
  period?: string;
  issued_at?: string;
  payment_method?: string;
  pdf_generated_at?: string;
  [key: string]: any;
}

export interface BillServiceRow {
  description: string;
  usage: string;
  amount: number;
  source: 'deployment' | 'tool';
  currency?: string;
  name?: string;
}

export interface ScopeOption {
  id: string;
  name: string;
}