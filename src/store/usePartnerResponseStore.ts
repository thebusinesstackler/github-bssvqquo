import { create } from 'zustand';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Partner } from '../types';

interface PartnerResponseMetrics {
  partnerId: string;
  partnerName: string;
  responseRate: number;
  averageResponseTime: number;
  totalLeads: number;
  totalResponses: number;
  lastResponseDate?: Date;
  recentTrend: 'improving' | 'declining' | 'stable';
}

interface PartnerResponseStore {
  metrics: PartnerResponseMetrics[];
  isLoading: boolean;
  error: string | null;
  
  fetchResponseMetrics: () => Promise<void>;
  getPartnerMetrics: (partnerId: string) => PartnerResponseMetrics | null;
  updateResponseMetrics: (partnerId: string, leadId: string, responseTimeHours: number) => Promise<void>;
}

export const usePartnerResponseStore = create<PartnerResponseStore>((set, get) => ({
  metrics: [],
  isLoading: false,
  error: null,
  
  fetchResponseMetrics: async () => {
    set({ isLoading: true, error: null });
    try {
      const partnersRef = collection(db, 'partners');
      const snapshot = await getDocs(
        query(partnersRef, where('role', '==', 'partner'))
      );
      
      const metrics: PartnerResponseMetrics[] = [];
      
      for (const partnerDoc of snapshot.docs) {
        const partnerData = partnerDoc.data() as Partner;
        
        // Extract response metrics or set defaults
        metrics.push({
          partnerId: partnerDoc.id,
          partnerName: partnerData.name,
          responseRate: partnerData.responseMetrics?.responseRate || 0,
          averageResponseTime: partnerData.responseMetrics?.averageResponseTime || 0,
          totalLeads: partnerData.responseMetrics?.totalLeadsReceived || 0,
          totalResponses: partnerData.responseMetrics?.totalLeadsContacted || 0,
          lastResponseDate: partnerData.responseMetrics?.lastResponseDate?.toDate() || undefined,
          recentTrend: partnerData.responseMetrics?.lastWeekPerformance?.trend || 'stable'
        });
      }
      
      set({ metrics, isLoading: false });
    } catch (error) {
      console.error('Error fetching response metrics:', error);
      set({ error: 'Failed to load response metrics', isLoading: false });
    }
  },
  
  getPartnerMetrics: (partnerId: string) => {
    const { metrics } = get();
    return metrics.find(m => m.partnerId === partnerId) || null;
  },
  
  updateResponseMetrics: async (partnerId: string, leadId: string, responseTimeHours: number) => {
    set({ isLoading: true, error: null });
    try {
      const partnerRef = doc(db, 'partners', partnerId);
      const partnerDoc = await getDocs(query(doc(db, 'partners', partnerId)));
      
      if (!partnerDoc.exists) {
        throw new Error('Partner not found');
      }
      
      const partnerData = partnerDoc.data() as Partner;
      const currentMetrics = partnerData.responseMetrics || {
        responseRate: 0,
        averageResponseTime: 0,
        totalLeadsReceived: 0,
        totalLeadsContacted: 0,
        lastWeekPerformance: {
          leads: 0,
          responses: 0,
          averageTime: 0,
          trend: 'stable' as 'improving' | 'declining' | 'stable'
        }
      };
      
      // Calculate new metrics
      const newTotalResponses = currentMetrics.totalLeadsContacted + 1;
      const newAverageTime = (
        (currentMetrics.averageResponseTime * currentMetrics.totalLeadsContacted) + responseTimeHours
      ) / newTotalResponses;
      
      // Calculate new response rate
      const newResponseRate = Math.round(
        (newTotalResponses / currentMetrics.totalLeadsReceived) * 100
      );
      
      // Update weekly performance trend
      const lastWeekPerformance = {
        ...currentMetrics.lastWeekPerformance,
        responses: currentMetrics.lastWeekPerformance.responses + 1,
        averageTime: (
          (currentMetrics.lastWeekPerformance.averageTime * currentMetrics.lastWeekPerformance.responses) + 
          responseTimeHours
        ) / (currentMetrics.lastWeekPerformance.responses + 1)
      };
      
      // Calculate trend
      const trend: 'improving' | 'declining' | 'stable' = 
        newAverageTime < currentMetrics.averageResponseTime ? 'improving' :
        newAverageTime > currentMetrics.averageResponseTime ? 'declining' : 'stable';
      
      // Update partner document with new metrics
      await updateDoc(partnerRef, {
        'responseMetrics.responseRate': newResponseRate,
        'responseMetrics.averageResponseTime': newAverageTime,
        'responseMetrics.totalLeadsContacted': newTotalResponses,
        'responseMetrics.lastResponseDate': serverTimestamp(),
        'responseMetrics.lastWeekPerformance': {
          ...lastWeekPerformance,
          trend
        },
        'responseMetrics.leadResponses': {
          [leadId]: {
            responseTime: responseTimeHours,
            respondedAt: serverTimestamp()
          }
        }
      });
      
      // Update local state
      set(state => ({
        metrics: state.metrics.map(metric => 
          metric.partnerId === partnerId
            ? {
                ...metric,
                responseRate: newResponseRate,
                averageResponseTime: newAverageTime,
                totalResponses: newTotalResponses,
                lastResponseDate: new Date(),
                recentTrend: trend
              }
            : metric
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Error updating response metrics:', error);
      set({ error: 'Failed to update response metrics', isLoading: false });
    }
  }
}));