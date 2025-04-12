import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Receipt,
  AlertCircle,
  CheckCircle,
  FileText,
  Calendar,
  DollarSign,
  Download,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock8,
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format, addMonths } from 'date-fns';
import { useAdminStore } from '../../store/useAdminStore';
import { getCustomerPortalUrl } from '../../lib/stripe';

interface Transaction {
  id: string;
  amount: number;
  status: 'succeeded' | 'pending' | 'failed';
  date: Date;
  description: string;
  receiptUrl?: string;
  customerId: string;
  subscription?: string;
}

interface Invoice {
  id: string;
  amount: number;
  status: 'paid' | 'open' | 'draft' | 'uncollectible' | 'void';
  date: Date;
  dueDate: Date;
  description: string;
  pdfUrl?: string;
  customerId: string;
}

export function BillingDashboard() {
  const { partners, selectedPartnerId, getPartner } = useAdminStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<'transactions' | 'invoices' | 'subscription'>('subscription');
  const [viewingManageBilling, setViewingManageBilling] = useState(false);
  const [processingPortalRequest, setProcessingPortalRequest] = useState(false);

  // Get the selected partner object
  const partner = selectedPartnerId ? getPartner(selectedPartnerId) : null;

  useEffect(() => {
    if (selectedPartnerId) {
      fetchBillingData(selectedPartnerId);
    } else {
      setTransactions([]);
      setInvoices([]);
      setLoading(false);
    }
  }, [selectedPartnerId]);

  const fetchBillingData = async (partnerId: string) => {
    setLoading(true);
    try {
      // Fetch the partner's data
      const partnerRef = doc(db, 'partners', partnerId);
      const partnerDoc = await getDoc(partnerRef);
      
      if (!partnerDoc.exists()) {
        throw new Error('Partner not found');
      }

      const partnerData = partnerDoc.data();
      const stripeCustomerId = partnerData.billing?.stripeCustomerId;

      // If no Stripe customer ID, we don't have data yet
      if (!stripeCustomerId) {
        setLoading(false);
        return;
      }

      // Fetch transactions from a 'transactions' collection
      const transactionsQuery = query(
        collection(db, 'stripe_payments'),
        where('customerId', '==', stripeCustomerId),
        orderBy('created', 'desc')
      );

      const transactionsSnapshot = await getDocs(transactionsQuery);
      const fetchedTransactions = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().created?.toDate() || new Date(),
        amount: doc.data().amount / 100, // Convert from cents to dollars
      })) as Transaction[];

      // Fetch invoices from an 'invoices' collection
      const invoicesQuery = query(
        collection(db, 'stripe_invoices'),
        where('customerId', '==', stripeCustomerId),
        orderBy('created', 'desc')
      );

      const invoicesSnapshot = await getDocs(invoicesQuery);
      const fetchedInvoices = invoicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().created?.toDate() || new Date(),
        dueDate: doc.data().dueDate?.toDate() || new Date(),
        amount: doc.data().amount_paid / 100, // Convert from cents to dollars
      })) as Invoice[];

      setTransactions(fetchedTransactions);
      setInvoices(fetchedInvoices);
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!selectedPartnerId) {
      setError('No partner selected');
      return;
    }

    setProcessingPortalRequest(true);
    try {
      await getCustomerPortalUrl(selectedPartnerId);
      // Redirect handled by the getCustomerPortalUrl function
    } catch (err) {
      console.error('Error redirecting to billing portal:', err);
      setError('Failed to open billing portal');
    } finally {
      setProcessingPortalRequest(false);
    }
  };

  const getSubscriptionStatusClass = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'incomplete':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderNoPartnerSelected = () => (
    <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center justify-center h-64">
      <CreditCard className="w-12 h-12 text-gray-400 mb-4" />
      <p className="text-gray-500 text-center">
        Select a partner from the list to view their billing information
      </p>
    </div>
  );

  // Generate placeholder data if no real data available
  const generatePlaceholderData = () => {
    const currentDate = new Date();
    
    const placeholderTransactions: Transaction[] = [
      {
        id: '1',
        amount: partner?.subscription === 'professional' ? 299 : partner?.subscription === 'enterprise' ? 499 : 180,
        status: 'succeeded',
        date: currentDate,
        description: `${partner?.subscription || 'Basic'} Plan - Monthly Subscription`,
        customerId: selectedPartnerId || '',
        subscription: partner?.subscription || 'basic'
      },
      {
        id: '2',
        amount: partner?.subscription === 'professional' ? 299 : partner?.subscription === 'enterprise' ? 499 : 180,
        status: 'succeeded',
        date: new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000),
        description: `${partner?.subscription || 'Basic'} Plan - Monthly Subscription`,
        customerId: selectedPartnerId || '',
        subscription: partner?.subscription || 'basic'
      }
    ];

    const placeholderInvoices: Invoice[] = [
      {
        id: '1',
        amount: partner?.subscription === 'professional' ? 299 : partner?.subscription === 'enterprise' ? 499 : 180,
        status: 'paid',
        date: currentDate,
        dueDate: addMonths(currentDate, 1),
        description: `${partner?.subscription || 'Basic'} Plan - Monthly Subscription`,
        customerId: selectedPartnerId || ''
      },
      {
        id: '2',
        amount: partner?.subscription === 'professional' ? 299 : partner?.subscription === 'enterprise' ? 499 : 180,
        status: 'paid',
        date: new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000),
        dueDate: currentDate,
        description: `${partner?.subscription || 'Basic'} Plan - Monthly Subscription`,
        customerId: selectedPartnerId || ''
      }
    ];

    return { placeholderTransactions, placeholderInvoices };
  };

  // Use real data if available, otherwise use placeholder data
  const { placeholderTransactions, placeholderInvoices } = generatePlaceholderData();
  const displayTransactions = transactions.length > 0 ? transactions : placeholderTransactions;
  const displayInvoices = invoices.length > 0 ? invoices : placeholderInvoices;

  if (!selectedPartnerId) {
    return renderNoPartnerSelected();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Billing Management</h2>
        {partner && (
          <span className="text-sm text-gray-500">
            Partner: <span className="font-medium">{partner.name}</span>
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      {/* Navigation tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setCurrentSection('subscription')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              currentSection === 'subscription'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Subscription Details
          </button>
          <button
            onClick={() => setCurrentSection('transactions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              currentSection === 'transactions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Payment History
          </button>
          <button
            onClick={() => setCurrentSection('invoices')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              currentSection === 'invoices'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Invoices
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {currentSection === 'subscription' && (
            <>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Current Subscription</h3>
                </div>
                <div className="px-6 py-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900 capitalize">
                        {partner?.subscription || 'No'} Plan
                      </h4>
                      <p className="text-gray-500 mt-1">
                        {partner?.subscription === 'basic'
                          ? 'Up to 50 leads per month with basic features'
                          : partner?.subscription === 'professional'
                          ? 'Up to 100 leads per month with advanced features'
                          : partner?.subscription === 'enterprise'
                          ? 'Unlimited leads with premium features'
                          : 'No active subscription'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSubscriptionStatusClass(
                      partner?.billing?.status
                    )}`}>
                      {partner?.billing?.status ? (
                        partner.billing.status.charAt(0).toUpperCase() + partner.billing.status.slice(1)
                      ) : (
                        'Inactive'
                      )}
                    </span>
                  </div>

                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
                          Monthly Cost
                        </dt>
                        <dd className="mt-1 text-lg font-medium text-gray-900">
                          ${partner?.billing?.amount || (
                            partner?.subscription === 'basic' ? 180 :
                            partner?.subscription === 'professional' ? 299 :
                            partner?.subscription === 'enterprise' ? 499 : 0
                          )}
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                          Billing Cycle
                        </dt>
                        <dd className="mt-1 text-lg font-medium text-gray-900">Monthly</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <Clock className="w-5 h-5 text-gray-400 mr-2" />
                          Next Billing Date
                        </dt>
                        <dd className="mt-1 text-lg font-medium text-gray-900">
                          {partner?.billing?.nextBillingDate ? (
                            format(partner.billing.nextBillingDate, 'MMM d, yyyy')
                          ) : (
                            format(addMonths(new Date(), 1), 'MMM d, yyyy')
                          )}
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <CreditCard className="w-5 h-5 text-gray-400 mr-2" />
                          Payment Method
                        </dt>
                        <dd className="mt-1 text-lg font-medium text-gray-900">
                          {partner?.billing?.paymentMethod ? (
                            <span className="flex items-center">
                              {partner.billing.paymentMethod.type === 'credit_card' && (
                                <>
                                  {partner.billing.paymentMethod.brand && (
                                    <span className="capitalize mr-2">{partner.billing.paymentMethod.brand}</span>
                                  )}
                                  ending in {partner.billing.paymentMethod.last4 || '****'}
                                </>
                              )}
                            </span>
                          ) : (
                            'None'
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleManageBilling}
                      disabled={processingPortalRequest}
                      className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {processingPortalRequest ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Manage Subscription'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Subscription Details</h3>
                </div>
                <div className="px-6 py-5">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Plan Features</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <ul className="space-y-2">
                          {partner?.subscription === 'basic' && (
                            <>
                              <li className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>Up to 50 leads per month</span>
                              </li>
                              <li className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>Basic lead management tools</span>
                              </li>
                              <li className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>Email support</span>
                              </li>
                              <li className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>Basic analytics</span>
                              </li>
                            </>
                          )}
                          {partner?.subscription === 'professional' && (
                            <>
                              <li className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>Up to 100 leads per month</span>
                              </li>
                              <li className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>Advanced lead management tools</span>
                              </li>
                              <li className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>Priority support</span>
                              </li>
                              <li className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>Advanced analytics</span>
                              </li>
                              <li className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>Custom integrations</span>
                              </li>
                            </>
                          )}
                          {partner?.subscription === 'enterprise' && (
                            <>
                              <li className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>Unlimited leads</span>
                              </li>
                              <li className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>Full platform access</span>
                              </li>
                              <li className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>24/7 premium support</span>
                              </li>
                              <li className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>Custom development</span>
                              </li>
                              <li className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>White-label options</span>
                              </li>
                              <li className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>API access</span>
                              </li>
                            </>
                          )}
                          {!partner?.subscription || partner.subscription === 'none' && (
                            <li className="text-gray-500">No active subscription features</li>
                          )}
                        </ul>
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Subscription ID</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {partner?.billing?.stripeSubscriptionId || 'Not available'}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Customer ID</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {partner?.billing?.stripeCustomerId || 'Not available'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </>
          )}

          {currentSection === 'transactions' && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
              </div>
              
              {displayTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Receipt
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {displayTransactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(transaction.date, 'MMM d, yyyy')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {transaction.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ${transaction.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              transaction.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                              transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.receiptUrl ? (
                              <a
                                href={transaction.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Receipt
                              </a>
                            ) : (
                              <span className="text-gray-400">Not available</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-5 text-center text-gray-500">
                  No payment history available for this partner
                </div>
              )}
            </div>
          )}

          {currentSection === 'invoices' && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Invoices</h3>
              </div>
              
              {displayInvoices.length > 0 ? (
                <div>
                  {displayInvoices.map((invoice) => (
                    <div key={invoice.id} className="border-b border-gray-200">
                      <button
                        onClick={() => setExpandedInvoice(expandedInvoice === invoice.id ? null : invoice.id)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-gray-400 mr-3" />
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-900">{invoice.description}</p>
                            <p className="text-xs text-gray-500">{format(invoice.date, 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full mr-4 ${
                            invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                            invoice.status === 'open' ? 'bg-blue-100 text-blue-800' :
                            invoice.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                          <span className="font-medium text-gray-900 mr-2">
                            ${invoice.amount.toFixed(2)}
                          </span>
                          {expandedInvoice === invoice.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </button>
                      
                      {expandedInvoice === invoice.id && (
                        <div className="px-6 py-4 bg-gray-50">
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 text-sm">
                            <div>
                              <dt className="font-medium text-gray-500">Invoice Number</dt>
                              <dd className="mt-1">{invoice.id}</dd>
                            </div>
                            <div>
                              <dt className="font-medium text-gray-500">Amount</dt>
                              <dd className="mt-1 font-medium">${invoice.amount.toFixed(2)}</dd>
                            </div>
                            <div>
                              <dt className="font-medium text-gray-500">Issue Date</dt>
                              <dd className="mt-1">{format(invoice.date, 'MMMM d, yyyy')}</dd>
                            </div>
                            <div>
                              <dt className="font-medium text-gray-500">Due Date</dt>
                              <dd className="mt-1">{format(invoice.dueDate, 'MMMM d, yyyy')}</dd>
                            </div>
                            <div className="sm:col-span-2 flex justify-end">
                              {invoice.pdfUrl ? (
                                <a
                                  href={invoice.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center text-blue-600 hover:text-blue-800"
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Download PDF
                                </a>
                              ) : (
                                <span className="text-gray-400 flex items-center">
                                  <FileText className="w-4 h-4 mr-1" />
                                  PDF not available
                                </span>
                              )}
                            </div>
                          </dl>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-5 text-center text-gray-500">
                  No invoices available for this partner
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}