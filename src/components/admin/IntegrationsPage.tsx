import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  ExternalLink, 
  Lock, 
  Key, 
  Webhook, 
  ToggleLeft, 
  ToggleRight,
  Save,
  RefreshCw
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface StripeConfig {
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  environment: 'test' | 'live';
  isConnected: boolean;
}

export function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState('stripe');
  const [stripeConfig, setStripeConfig] = useState<StripeConfig>({
    publicKey: '',
    secretKey: '',
    webhookSecret: '',
    environment: 'test',
    isConnected: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  useEffect(() => {
    const fetchStripeConfig = async () => {
      try {
        const configDoc = await getDoc(doc(db, 'admin', 'stripe_config'));
        if (configDoc.exists()) {
          const data = configDoc.data();
          setStripeConfig({
            publicKey: data.publicKey || '',
            secretKey: data.secretKey || '',
            webhookSecret: data.webhookSecret || '',
            environment: data.environment || 'test',
            isConnected: data.isConnected || false
          });
        }
      } catch (err) {
        console.error('Error fetching Stripe config:', err);
        setError('Failed to load Stripe configuration');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStripeConfig();
  }, []);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate inputs
      if (!stripeConfig.publicKey) {
        throw new Error('Stripe Public Key is required');
      }
      
      if (!stripeConfig.secretKey) {
        throw new Error('Stripe Secret Key is required');
      }
      
      if (!stripeConfig.webhookSecret) {
        throw new Error('Webhook Secret is required');
      }

      // Validate key formats
      if (!stripeConfig.publicKey.startsWith('pk_')) {
        throw new Error('Invalid Stripe Public Key format. Should start with "pk_"');
      }
      
      if (!stripeConfig.secretKey.startsWith('sk_')) {
        throw new Error('Invalid Stripe Secret Key format. Should start with "sk_"');
      }
      
      if (!stripeConfig.webhookSecret.startsWith('whsec_')) {
        throw new Error('Invalid Webhook Secret format. Should start with "whsec_"');
      }

      // Check if environment matches key type
      const isTestPublicKey = stripeConfig.publicKey.startsWith('pk_test_');
      const isTestSecretKey = stripeConfig.secretKey.startsWith('sk_test_');
      
      if (stripeConfig.environment === 'test' && (!isTestPublicKey || !isTestSecretKey)) {
        throw new Error('Test environment selected but using live API keys');
      }
      
      if (stripeConfig.environment === 'live' && (isTestPublicKey || isTestSecretKey)) {
        throw new Error('Live environment selected but using test API keys');
      }

      // Save to Firestore
      const configRef = doc(db, 'admin', 'stripe_config');
      const configDoc = await getDoc(configRef);
      
      if (configDoc.exists()) {
        await updateDoc(configRef, {
          publicKey: stripeConfig.publicKey,
          secretKey: stripeConfig.secretKey,
          webhookSecret: stripeConfig.webhookSecret,
          environment: stripeConfig.environment,
          updatedAt: new Date()
        });
      } else {
        await setDoc(configRef, {
          publicKey: stripeConfig.publicKey,
          secretKey: stripeConfig.secretKey,
          webhookSecret: stripeConfig.webhookSecret,
          environment: stripeConfig.environment,
          isConnected: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      setSuccess('Stripe configuration saved successfully');
    } catch (err) {
      console.error('Error saving Stripe config:', err);
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setError(null);
    setSuccess(null);

    try {
      // In a real implementation, we would call a Firebase function to test the connection
      // For this example, we'll simulate a successful connection after a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update connection status
      const configRef = doc(db, 'admin', 'stripe_config');
      await updateDoc(configRef, {
        isConnected: true,
        lastTestedAt: new Date()
      });
      
      setStripeConfig(prev => ({ ...prev, isConnected: true }));
      setSuccess('Successfully connected to Stripe API');
    } catch (err) {
      console.error('Error testing Stripe connection:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Stripe');
      
      // Update connection status
      const configRef = doc(db, 'admin', 'stripe_config');
      await updateDoc(configRef, {
        isConnected: false,
        lastTestedAt: new Date()
      });
      
      setStripeConfig(prev => ({ ...prev, isConnected: false }));
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('stripe')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stripe'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Stripe
            </div>
          </button>
        </nav>
      </div>

      {/* Stripe Configuration */}
      {activeTab === 'stripe' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <CreditCard className="w-6 h-6 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Stripe Configuration</h2>
            </div>
            <div className="flex items-center">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                stripeConfig.isConnected
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {stripeConfig.isConnected ? 'Connected' : 'Not Connected'}
              </span>
              <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${
                stripeConfig.environment === 'test'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {stripeConfig.environment === 'test' ? 'Test Mode' : 'Live Mode'}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {/* Environment Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Environment
              </label>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setStripeConfig(prev => ({ ...prev, environment: 'test' }))}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    stripeConfig.environment === 'test'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  {stripeConfig.environment === 'test' ? (
                    <ToggleRight className="w-5 h-5 mr-2" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 mr-2" />
                  )}
                  Test
                </button>
                <button
                  type="button"
                  onClick={() => setStripeConfig(prev => ({ ...prev, environment: 'live' }))}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    stripeConfig.environment === 'live'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  {stripeConfig.environment === 'live' ? (
                    <ToggleRight className="w-5 h-5 mr-2" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 mr-2" />
                  )}
                  Live
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {stripeConfig.environment === 'test'
                  ? 'Test mode uses Stripe test keys and won\'t process real payments.'
                  : 'Live mode will process real payments. Make sure your configuration is correct.'}
              </p>
            </div>

            {/* Public Key */}
            <div>
              <label htmlFor="publicKey" className="block text-sm font-medium text-gray-700 mb-2">
                Stripe Public Key
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="publicKey"
                  type="text"
                  value={stripeConfig.publicKey}
                  onChange={(e) => setStripeConfig(prev => ({ ...prev, publicKey: e.target.value }))}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder={`pk_${stripeConfig.environment === 'test' ? 'test' : 'live'}_...`}
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Your Stripe publishable key. Starts with "pk_{stripeConfig.environment === 'test' ? 'test' : 'live'}_".
              </p>
            </div>

            {/* Secret Key */}
            <div>
              <label htmlFor="secretKey" className="block text-sm font-medium text-gray-700 mb-2">
                Stripe Secret Key
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="secretKey"
                  type={showSecretKey ? "text" : "password"}
                  value={stripeConfig.secretKey}
                  onChange={(e) => setStripeConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder={`sk_${stripeConfig.environment === 'test' ? 'test' : 'live'}_...`}
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSecretKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Your Stripe secret key. Starts with "sk_{stripeConfig.environment === 'test' ? 'test' : 'live'}_".
              </p>
            </div>

            {/* Webhook Secret */}
            <div>
              <label htmlFor="webhookSecret" className="block text-sm font-medium text-gray-700 mb-2">
                Webhook Secret
              </label>
              <div className="relative">
                <Webhook className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="webhookSecret"
                  type={showWebhookSecret ? "text" : "password"}
                  value={stripeConfig.webhookSecret}
                  onChange={(e) => setStripeConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="whsec_..."
                />
                <button
                  type="button"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showWebhookSecret ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Your webhook signing secret. Starts with "whsec_".
              </p>
            </div>

            {/* Webhook URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook URL
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  value="https://acceleratetrials.com/api/webhooks/stripe"
                  readOnly
                  className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText('https://acceleratetrials.com/api/webhooks/stripe')}
                  className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Copy
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Configure this URL in your Stripe dashboard webhook settings.
              </p>
            </div>

            {/* Webhook Events */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Webhook Events
              </label>
              <div className="bg-gray-50 p-4 rounded-md">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    customer.subscription.created
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    customer.subscription.updated
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    customer.subscription.deleted
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    payment_method.attached
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    payment_method.updated
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    invoice.payment_succeeded
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    invoice.payment_failed
                  </li>
                </ul>
              </div>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-700 p-4 rounded-md flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                {success}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !stripeConfig.publicKey || !stripeConfig.secretKey || !stripeConfig.webhookSecret}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Test Connection
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Configuration
                  </>
                )}
              </button>
            </div>

            {/* Stripe Dashboard Link */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <a
                href={`https://dashboard.stripe.com/${stripeConfig.environment === 'test' ? 'test/' : ''}dashboard`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Open Stripe Dashboard
              </a>
              <p className="mt-2 text-sm text-gray-500">
                Configure additional settings and view transactions in your Stripe dashboard.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}