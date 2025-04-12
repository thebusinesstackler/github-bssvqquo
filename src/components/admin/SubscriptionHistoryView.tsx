import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  User, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface SubscriptionChange {
  id: string;
  partnerId: string;
  partnerName: string;
  fromTier: string;
  toTier: string;
  changedBy: string;
  changedByName?: string;
  reason?: string;
  timestamp: Date;
  isUpgrade: boolean;
  isDowngrade: boolean;
}

export function SubscriptionHistoryView({ partnerId }: { partnerId?: string }) {
  const { partners } = useAdminStore();
  const [history, setHistory] = useState<SubscriptionChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const subscriptionHistoryRef = collection(db, 'subscription_history');
      let q;
      
      if (partnerId) {
        // If a specific partner ID is provided, only get history for that partner
        q = query(
          subscriptionHistoryRef,
          where('partnerId', '==', partnerId),
          orderBy('timestamp', 'desc')
        );
      } else {
        // Otherwise, get all history
        q = query(
          subscriptionHistoryRef,
          orderBy('timestamp', 'desc')
        );
      }
      
      const snapshot = await getDocs(q);
      
      // Map documents to our interface
      const historyItems = snapshot.docs.map(doc => {
        const data = doc.data();
        // Determine if this was an upgrade or downgrade
        const subscriptionTiers = ['none', 'basic', 'professional', 'enterprise'];
        const fromIndex = subscriptionTiers.indexOf(data.fromTier);
        const toIndex = subscriptionTiers.indexOf(data.toTier);
        
        const isUpgrade = toIndex > fromIndex;
        const isDowngrade = toIndex < fromIndex;
        
        // Find partner details
        const partner = partners.find(p => p.id === data.partnerId);
        
        return {
          id: doc.id,
          partnerId: data.partnerId,
          partnerName: partner?.name || 'Unknown Partner',
          fromTier: data.fromTier,
          toTier: data.toTier,
          changedBy: data.changedBy,
          changedByName: data.changedByName || 'Admin',
          reason: data.reason,
          timestamp: data.timestamp.toDate(),
          isUpgrade,
          isDowngrade
        };
      });
      
      setHistory(historyItems);
    } catch (err) {
      console.error('Error fetching subscription history:', err);
      setError('Failed to load subscription history');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchHistory();
  }, [partnerId, partners]);
  
  // For demo purposes, generate some fake history if none exists
  const generateDemoHistory = (): SubscriptionChange[] => {
    if (history.length > 0) return history;
    
    const partner = partnerId ? partners.find(p => p.id === partnerId) : partners[0];
    if (!partner) return [];
    
    return [
      {
        id: '1',
        partnerId: partner.id,
        partnerName: partner.name,
        fromTier: 'basic',
        toTier: 'professional',
        changedBy: 'admin',
        changedByName: 'Admin User',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        isUpgrade: true,
        isDowngrade: false
      },
      {
        id: '2',
        partnerId: partner.id,
        partnerName: partner.name,
        fromTier: 'none',
        toTier: 'basic',
        changedBy: 'admin',
        changedByName: 'Admin User',
        timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        isUpgrade: true,
        isDowngrade: false
      }
    ];
  };
  
  const displayHistory = history.length > 0 ? history : generateDemoHistory();

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {partnerId ? 'Partner Subscription History' : 'Subscription Changes History'}
        </h3>
        <button
          onClick={fetchHistory}
          className="text-gray-600 hover:text-gray-900"
          disabled={loading}
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-6 text-red-600">{error}</div>
      ) : displayHistory.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p>No subscription changes found</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {displayHistory.map((item) => (
            <div key={item.id} className="p-6">
              <div className="flex items-start">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  item.isUpgrade 
                    ? 'bg-green-100 text-green-700' 
                    : item.isDowngrade 
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                }`}>
                  {item.isUpgrade ? (
                    <ArrowUpRight className="w-6 h-6" />
                  ) : item.isDowngrade ? (
                    <ArrowDownRight className="w-6 h-6" />
                  ) : (
                    <CreditCard className="w-6 h-6" />
                  )}
                </div>
                
                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.partnerName}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.isUpgrade 
                          ? `Upgraded from ${item.fromTier} to ${item.toTier}` 
                          : item.isDowngrade 
                            ? `Downgraded from ${item.fromTier} to ${item.toTier}`
                            : `Changed from ${item.fromTier} to ${item.toTier}`
                        }
                      </p>
                      {item.reason && (
                        <p className="text-xs text-gray-500 mt-2 italic">
                          "{item.reason}"
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {format(item.timestamp, 'MMM d, yyyy')}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {format(item.timestamp, 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500 flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    Changed by: {item.changedByName}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}