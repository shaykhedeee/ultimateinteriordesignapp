export interface QuoteItem {
  id: string;
  category?: string; // Room or zone (e.g. "Kitchen", "Master Bedroom")
  description: string;
  dimensions: string;
  sqft: number;
  rate: number;
  baseRate?: number; // Base catalog rate before material premium markups
  amount: number;
  isLumpSum?: boolean; // If true, ignores dimensions and uses direct amount
  unit?: string; // e.g. "Sqft", "Nos", "Rft", "LS"
  notes?: string;
  material?: string; // BWR Plywood, MDF, etc.
  finish?: string;   // Acrylic, Laminate, etc.
  hardware?: string; // Hettich, Blum, etc.
}

export type QuoteStatus = 'DRAFT' | 'INITIAL_QUOTE' | 'SENT' | 'APPROVED' | 'REJECTED';

export interface BankDetails {
  accountName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  upiId?: string;
}

export interface CompanyProfile {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  gstNo?: string;
  logo?: string; // Base64
  signature?: string; // Base64
  bankDetails: BankDetails;
}

export interface PaymentMilestone {
  milestone: string;
  percentage: number;
  amount: number;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  projectLocation: string;
  projectType: string;
  dateOfIssue: string;
  validUntil: string;
  items: QuoteItem[];
  requestedItems: QuoteItem[]; // Optional items
  
  // Financials
  isGstEnabled: boolean;
  gstPercentage: number;
  subtotal: number;
  discount: number;
  gst: number;
  grandTotal: number;
  
  // Custom Content
  projectDuration?: string; // e.g. "40 Working Days"
  paymentSchedule?: PaymentMilestone[];
  specifications: string[];
  terms: string[];
  bankDetails: BankDetails;
  notes?: string;
  
  // Client Sign-off
  clientSignature?: string; // Base64 signature
  clientApprovedDate?: string;
  clientFeedback?: string;

  // Costing
  costing?: {
    manufacturingCost: number;
    hardwareCost: number;
    transportCost: number;
    laborCost: number;
    designFee: number;
    contingency: number;
  };

  // Metadata
  status: QuoteStatus;
  revision: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomTemplate {
  id: string;
  name: string;
  projectType: string;
  items: QuoteItem[];
  requestedItems: QuoteItem[];
  specifications: string[];
  terms: string[];
  notes?: string;
}

export interface RateItem {
  id: string;
  category: string; // Foyer, Living Room, Kitchen, Wardrobe, TV Unit, Services etc.
  name: string;
  defaultDimensions: string;
  defaultRate: number;
  rateType: 'SQFT' | 'LUMPSUM';
  defaultUnit: string;
  defaultMaterial?: string;
  defaultFinish?: string;
  defaultHardware?: string;
}

export interface MaterialItem {
  id: string;
  name: string;
  type: 'carcass' | 'finish' | 'hardware';
  markupPercentage: number; // e.g. 0.15 for +15%
  description?: string;
}

export enum ViewState {
  LIST = 'LIST',
  EDIT = 'EDIT',
  PREVIEW = 'PREVIEW',
  SETTINGS = 'SETTINGS',
  RATE_CARD = 'RATE_CARD',
  MATERIALS = 'MATERIALS',
  TEMPLATES = 'TEMPLATES',
  CLIENT_VIEW = 'CLIENT_VIEW',
  ANALYSER = 'ANALYSER'
}

