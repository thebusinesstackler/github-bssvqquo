export interface StripeCheckoutSession {
  price: string;
  success_url: string;
  cancel_url: string;
  mode: 'subscription' | 'payment';
  payment_method_types: string[];
  metadata: {
    partnerId: string;
    [key: string]: string;
  };
}

export interface StripePortalSession {
  partnerId: string;
  returnUrl: string;
}

export interface StripeSubscription {
  id: string;
  partnerId: string;
  status: string;
  priceId: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  metadata: {
    tier: string;
    maxLeads: number;
    [key: string]: any;
  };
}

export interface StripePaymentMethod {
  id: string;
  partnerId: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}