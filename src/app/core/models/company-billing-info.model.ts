export interface CompanyBillingInfo {
  companyName: string | null;
  gstNumber: string | null;
  panNumber?: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
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
  credit_applied?: number;
  [key: string]: any;
}

export interface BillServiceRow {
  description: string;
  usage: string;
  amount: number;
  source: 'application' | 'tool';
  currency?: string;
  name?: string;
  uptimeHours?: string | number;
  instanceCost?: number;
  cpuCost?: number;
  memoryCost?: number;
  instanceType?: string;
  cpu?: string | number;
  memory?: string | number;
}

export interface ScopeOption {
  id: string;
  name: string;
}
