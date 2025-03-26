import { Timestamp } from 'firebase/firestore';

export type LeadStatus = 'new' | 'not_contacted' | 'contacted' | 'qualified' | 'converted' | 'lost';

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
}

export interface LeadStatusChange {
  status: LeadStatus;
  timestamp: Date;
  updatedBy: string;
  notes?: string;
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
  role: 'partner' | 'admin';
  active: boolean;
  createdAt: Date;
  subscription: SubscriptionTier;
  maxLeads: number;
  currentLeads: number;
  responseMetrics: ResponseMetrics;
  billing: BillingInfo;
  notificationSettings: NotificationSettings;
  assignedForms?: string[];
}

export type SubscriptionTier = 'basic' | 'professional' | 'enterprise';

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
  plan: SubscriptionTier;
  status: 'active' | 'past_due' | 'canceled';
  nextBillingDate: Date;
  amount: number;
  paymentMethod: {
    type: string;
    last4: string;
  };
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
  role: 'admin' | 'partner';
  active: boolean;
  createdAt: Date;
  subscription?: SubscriptionTier;
  maxLeads?: number;
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