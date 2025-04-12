import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

/**
 * Records a subscription change in the history
 * @param partnerId The ID of the partner
 * @param fromTier The previous subscription tier
 * @param toTier The new subscription tier
 * @param changedBy The ID of the user who made the change (typically admin)
 * @param reason Optional reason for the change
 */
export async function recordSubscriptionChange(
  partnerId: string,
  fromTier: string,
  toTier: string,
  changedBy: string,
  changedByName?: string,
  reason?: string
): Promise<void> {
  try {
    await addDoc(collection(db, 'subscription_history'), {
      partnerId,
      fromTier,
      toTier,
      changedBy,
      changedByName,
      reason,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error recording subscription change:', error);
    // Don't throw the error - we don't want to fail the main operation
  }
}

/**
 * Returns the maximum number of leads for a given subscription tier
 */
export function getMaxLeadsForTier(tier: string): number {
  switch (tier) {
    case 'basic':
      return 50;
    case 'professional': 
      return 100;
    case 'enterprise':
      return 1000;
    case 'none':
    default:
      return 10; // Free tier gets 10 leads
  }
}

/**
 * Returns the monthly price for a given subscription tier
 */
export function getPriceForTier(tier: string): number {
  switch (tier) {
    case 'basic':
      return 180;
    case 'professional':
      return 299;
    case 'enterprise':
      return 499;
    case 'none':
    default:
      return 0;
  }
}

/**
 * Checks if a downgrade will remove any essential features
 */
export function willDowngradeAffectFeatures(fromTier: string, toTier: string): boolean {
  // Order of tiers from lowest to highest
  const tierOrder = ['none', 'basic', 'professional', 'enterprise'];
  
  const fromIndex = tierOrder.indexOf(fromTier);
  const toIndex = tierOrder.indexOf(toTier);
  
  // If going to a lower tier
  return toIndex < fromIndex;
}

/**
 * Gets a list of active subscriptions for reporting
 */
export async function getActiveSubscriptions() {
  try {
    const partnersRef = collection(db, 'partners');
    const q = query(
      partnersRef,
      where('subscription', '!=', 'none'),
      where('subscription', '!=', null),
      where('active', '==', true)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching active subscriptions:', error);
    throw error;
  }
}

/**
 * Generates a monthly subscription report
 */
export async function generateMonthlyReport() {
  try {
    const activeSubscriptions = await getActiveSubscriptions();
    
    // Group by subscription type
    const subscriptionCounts = {
      basic: 0,
      professional: 0,
      enterprise: 0
    };
    
    let totalRevenue = 0;
    
    activeSubscriptions.forEach(sub => {
      const tier = sub.subscription;
      if (tier in subscriptionCounts) {
        subscriptionCounts[tier as keyof typeof subscriptionCounts]++;
      }
      
      totalRevenue += getPriceForTier(tier);
    });
    
    return {
      totalActiveSubscriptions: activeSubscriptions.length,
      subscriptionCounts,
      totalRevenue,
      reportDate: new Date()
    };
  } catch (error) {
    console.error('Error generating monthly report:', error);
    throw error;
  }
}