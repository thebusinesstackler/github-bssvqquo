import { Timestamp } from 'firebase/firestore';

export type LeadStatus = 'new' | 'not_contacted' | 'contacted' | 'qualified' | 'converted' | 'lost';
export type LeadQuality = 'hot' | 'warm' | 'cold';

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: LeadStatus;
  partnerId: string;
  createdAt: Date;
  lastUpdated: Date;
  lastViewed?: Date;
  notes?: string;
  source?: string;
  indication?: string;
  protocol?: string;
  statusHistory?: LeadStatusChange[];
  messages?: Message[];
  formResponses?: FormResponse[];
  quality?: LeadQuality;
  assignedBy?: string;
  assignmentHistory?: LeadAssignment[];
  companyName?: string; // Added field
  siteId?: string;      // Reference to a specific site
}

export interface LeadStatusChange {
  status: LeadStatus;
  timestamp: Date;
  updatedBy: string;
  notes?: string;
}

export interface LeadAssignment {
  fromPartnerId?: string;
  toPartnerId: string;
  assignedBy: string;
  assignedAt: Date;
  reason?: string;
}

export interface Message {
  id: string;
  leadId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface Partner {
  id: string;
  name: string;
  email: string;
  role: 'partner' | 'admin' | 'sponsor';
  active: boolean;
  createdAt: Date;
  subscription: string;
  maxLeads: number;
  currentLeads: number;
  responseMetrics: ResponseMetrics;
  billing?: BillingInfo;
  notificationSettings: NotificationSettings;
  assignedForms?: string[];
  quotaUtilization?: number;
  firstName?: string;
  lastName?: string;
  siteName?: string;
  siteDetails?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    principalInvestigator: string;
    studyCoordinator?: string;
    specialties: string[];
    certifications: string[];
    capacity?: {
      maxPatients: number;
      currentPatients: number;
      studyRooms: number;
      staff: number;
    }
  };
}

export interface ResponseMetrics {
  averageResponseTime: number;
  responseRate: number;
  totalLeadsReceived: number;
  totalLeadsContacted: number;
  lastWeekPerformance: {
    leads: number;
    responses: number;
    averageTime: number;
  };
}

export interface BillingInfo {
  plan: string;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete';
  nextBillingDate: Date;
  amount: number;
  paymentMethod: {
    type: string;
    last4: string;
    brand?: string;
    expMonth?: number;
    expYear?: number;
  };
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
}

export interface NotificationSettings {
  newLeads: boolean;
  leadExpiration: boolean;
  messages: boolean;
  responseRate: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'partner' | 'sponsor';
  active: boolean;
  createdAt: Date;
  subscription?: string;
  maxLeads?: number;
  phone?: string;
  title?: string;
  company?: string;
  phoneNumber?: string;
  photoURL?: string;
  firstName?: string;
  lastName?: string;
}

export interface AdminMetrics {
  totalLeads: number;
  activePartners: number;
  averageResponseTime: number;
  totalRevenue: number;
  leadDistribution: {
    partnerName: string;
    leadsCount: number;
    responseRate: number;
  }[];
  revenueHistory: {
    month: string;
    revenue: number;
  }[];
}

export interface ScreenerField {
  id: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'radio' | 'checkbox' | 'select' | 'date';
  label: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  description?: string;
  category?: 'demographics' | 'medical' | 'eligibility' | 'contact';
}

export interface ScreenerForm {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'published';
  fields: ScreenerField[];
  embedCode?: string;
  protocol?: string;
  indication?: string;
  assignedPartners?: string[];
  version?: number;
  expirationDate?: Date;
}

export interface FormResponse {
  id: string;
  formId: string;
  leadId: string;
  partnerId: string;
  responses: {
    fieldId: string;
    value: string | string[] | number | boolean;
  }[];
  submittedAt: Date;
  score?: number;
  qualified?: boolean;
}

export interface PatientStatus {
  id: string;
  name: string;
}

export type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  sex: string;
  phone: string;
  email?: string;
  indication: string;
  status: 'ineligible' | 'screening' | 'eligible' | 'randomized' | 'completed' | 'archived';
  protocol?: string;
  site?: string;
  bmi?: number;
  createdAt: Date;
  lastUpdated: Date;
};

export interface Site {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  principalInvestigator: string;
  studyCoordinator: string;
  status: 'active' | 'inactive';
  leads: number;
  responseRate: string;
  createdAt: Date;
}

export interface Protocol {
  id: string;
  name: string;
  phase?: string;
  indication?: string;
  status?: 'active' | 'inactive' | 'completed';
  startDate?: Date;
  endDate?: Date;
  inclusionCriteria?: string[];
  exclusionCriteria?: string[];
}

export interface Indication {
  id: string;
  name: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  partnerId: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  lastContact?: Date;
  source?: string;
}

export type SubscriptionTier = 'none' | 'basic' | 'professional' | 'enterprise';

export interface LeadQuota {
  partnerId: string;
  partnerName: string;
  maxLeads: number;
  currentLeads: number;
  utilizationPercentage: number;
  history?: {
    date: Date;
    quota: number;
    utilization: number;
  }[];
}

export interface LeadPerformanceMetrics {
  partnerId: string;
  partnerName: string;
  totalLeads: number;
  contactRate: number;
  conversionRate: number;
  avgResponseTime: number; // in hours
  qualityDistribution: {
    hot: number;
    warm: number;
    cold: number;
  };
}

export interface LeadAssignmentHistory {
  leadId: string;
  leadName: string;
  quality: LeadQuality;
  assignments: {
    partnerId: string;
    partnerName: string;
    assignedAt: Date;
    assignedBy: string;
    reason?: string;
  }[];
}

export interface Notification {
  id: string;
  partnerId: string;
  title: string;
  message: string;
  type: 'system' | 'admin' | 'lead';
  read: boolean;
  createdAt: Date;
  leadId?: string;
  createdBy?: string;
}

export interface StripeSubscription {
  id: string;
  priceId: string;
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  partnerId: string;
  amount: number;
  plan: string;
}

export interface StripePaymentMethod {
  id: string;
  type: string;
  partnerId: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

export interface ActivityLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: Date;
  details: any;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  status: 'success' | 'error' | 'warning';
}

export interface PaymentTransaction {
  id: string;
  partnerId: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  createdAt: Date;
  description: string;
  paymentMethod: {
    type: string;
    last4?: string;
    brand?: string;
  };
  receiptUrl?: string;
  refunded?: boolean;
}

export interface Invoice {
  id: string;
  partnerId: string;
  amount: number;
  amountPaid: number;
  amountDue: number;
  status: 'paid' | 'open' | 'draft' | 'void';
  createdAt: Date;
  dueDate: Date;
  pdfUrl?: string;
  subscription?: string;
  description: string;
  lines: {
    description: string;
    amount: number;
    quantity?: number;
  }[];
}