import { create } from 'zustand';
import { Lead, LeadStatus } from '../types';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  arrayUnion,
  orderBy,
  Timestamp,
  getDoc,
  deleteDoc
} from 'firebase/firestore';

interface LeadStore {
  leads: Lead[];
  isLoading: boolean;
  error: string | null;
  fetchLeads: (userId: string) => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'lastUpdated'>) => Promise<void>;
  updateLeadStatus: (leadId: string, status: LeadStatus) => Promise<void>;
  updateLeadNotes: (leadId: string, note: string) => Promise<void>;
  reassignLead: (leadId: string, partnerId: string) => Promise<void>;
  markLeadViewed: (leadId: string) => Promise<void>;
}

export const useLeadStore = create<LeadStore>((set, get) => ({
  leads: [],
  isLoading: false,
  error: null,

  fetchLeads: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Validate userId
      if (!userId) {
        set({ isLoading: false });
        return;
      }

      // Get user document
      const userDoc = await getDoc(doc(db, 'partners', userId));
      
      // Handle non-existent user gracefully
      if (!userDoc.exists()) {
        set({ leads: [], isLoading: false });
        return;
      }

      const userData = userDoc.data();
      const isAdmin = userData.email === 'theranovex@gmail.com' || userData.email === 'digitaltackler@gmail.com';
      let leads: Lead[] = [];

      if (isAdmin) {
        // Admin can see all leads across all partners
        const partnersSnapshot = await getDocs(collection(db, 'partners'));
        for (const partnerDoc of partnersSnapshot.docs) {
          // Skip admin document
          if (partnerDoc.id === 'admin') continue;

          const leadsRef = collection(db, 'partners', partnerDoc.id, 'leads');
          const leadsSnapshot = await getDocs(
            query(leadsRef, orderBy('createdAt', 'desc'))
          );
          
          const partnerLeads = leadsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            partnerId: partnerDoc.id,
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
            lastViewed: doc.data().lastViewed?.toDate() || null
          })) as Lead[];
          
          leads = [...leads, ...partnerLeads];
        }
      } else {
        // Partners can only see their own leads
        const leadsRef = collection(db, 'partners', userId, 'leads');
        const leadsSnapshot = await getDocs(
          query(leadsRef, orderBy('createdAt', 'desc'))
        );
        
        leads = leadsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          partnerId: userId,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
          lastViewed: doc.data().lastViewed?.toDate() || null
        })) as Lead[];
      }

      set({ leads, isLoading: false, error: null });
    } catch (error) {
      console.error('Error fetching leads:', error);
      set({ 
        leads: [],
        error: error instanceof Error ? error.message : 'Failed to fetch leads', 
        isLoading: false 
      });
    }
  },

  addLead: async (leadData) => {
    set({ isLoading: true, error: null });
    try {
      const { partnerId, ...leadFields } = leadData;
      if (!partnerId) {
        throw new Error('Partner ID is required');
      }

      // Add lead to Firestore under the partner's leads subcollection
      const leadsRef = collection(db, 'partners', partnerId, 'leads');
      const docRef = await addDoc(leadsRef, {
        ...leadFields,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });

      // Create notification for the new lead
      await addDoc(collection(db, 'notifications'), {
        partnerId,
        title: 'New Lead Assigned',
        message: `A new lead (${leadData.firstName} ${leadData.lastName}) has been assigned to your site for ${leadData.indication}.`,
        type: 'system',
        read: false,
        createdAt: serverTimestamp()
      });

      // Add a message for the partner
      await addDoc(collection(db, 'messages'), {
        partnerId,
        leadId: docRef.id,
        content: `New lead assigned: ${leadData.firstName} ${leadData.lastName} - ${leadData.indication}. Please review and contact the patient within 24 hours.`,
        senderId: 'system',
        timestamp: serverTimestamp(),
        read: false
      });

      const newLead = {
        id: docRef.id,
        ...leadData,
        createdAt: new Date(),
        lastUpdated: new Date()
      } as Lead;

      set(state => ({
        leads: [newLead, ...state.leads],
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.error('Error adding lead:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add lead', 
        isLoading: false 
      });
    }
  },

  updateLeadStatus: async (leadId: string, status: LeadStatus) => {
    set({ isLoading: true, error: null });
    try {
      // First find the lead to get the partnerId
      const lead = get().leads.find(l => l.id === leadId);
      if (!lead?.partnerId) {
        throw new Error('Lead not found or missing partner ID');
      }

      const leadRef = doc(db, 'partners', lead.partnerId, 'leads', leadId);
      await updateDoc(leadRef, {
        status,
        lastUpdated: serverTimestamp(),
        statusHistory: arrayUnion({
          status,
          timestamp: Timestamp.now(),
          updatedBy: lead.partnerId
        })
      });

      set(state => ({
        leads: state.leads.map(lead =>
          lead.id === leadId
            ? { ...lead, status, lastUpdated: new Date() }
            : lead
        ),
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.error('Error updating lead status:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update lead status', 
        isLoading: false 
      });
      throw error;
    }
  },

  updateLeadNotes: async (leadId: string, note: string) => {
    set({ isLoading: true, error: null });
    try {
      // First find the lead to get the partnerId
      const lead = get().leads.find(l => l.id === leadId);
      if (!lead?.partnerId) {
        throw new Error('Lead not found or missing partner ID');
      }

      const leadRef = doc(db, 'partners', lead.partnerId, 'leads', leadId);
      await updateDoc(leadRef, {
        notes: note,
        lastUpdated: serverTimestamp()
      });

      set(state => ({
        leads: state.leads.map(lead =>
          lead.id === leadId
            ? { ...lead, notes: note, lastUpdated: new Date() }
            : lead
        ),
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.error('Error updating lead notes:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update lead notes', 
        isLoading: false 
      });
      throw error;
    }
  },

  reassignLead: async (leadId: string, newPartnerId: string) => {
    set({ isLoading: true, error: null });
    try {
      // First find the lead to get the current partnerId
      const lead = get().leads.find(l => l.id === leadId);
      if (!lead?.partnerId) {
        throw new Error('Lead not found or missing partner ID');
      }

      // Get the lead data
      const oldLeadRef = doc(db, 'partners', lead.partnerId, 'leads', leadId);
      const leadDoc = await getDoc(oldLeadRef);
      if (!leadDoc.exists()) {
        throw new Error('Lead document not found');
      }

      // Create the lead in the new partner's collection
      const newLeadsRef = collection(db, 'partners', newPartnerId, 'leads');
      const leadData = leadDoc.data();
      await addDoc(newLeadsRef, {
        ...leadData,
        lastUpdated: serverTimestamp()
      });

      // Delete the lead from the old partner's collection
      await deleteDoc(oldLeadRef);

      set(state => ({
        leads: state.leads.filter(l => l.id !== leadId),
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.error('Error reassigning lead:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to reassign lead', 
        isLoading: false 
      });
    }
  },

  markLeadViewed: async (leadId: string) => {
    try {
      const lead = get().leads.find(l => l.id === leadId);
      if (!lead?.partnerId) {
        throw new Error('Lead not found or missing partner ID');
      }

      const leadRef = doc(db, 'partners', lead.partnerId, 'leads', leadId);
      await updateDoc(leadRef, {
        lastViewed: serverTimestamp()
      });

      set(state => ({
        leads: state.leads.map(lead =>
          lead.id === leadId
            ? { ...lead, lastViewed: new Date() }
            : lead
        )
      }));
    } catch (error) {
      console.error('Error marking lead as viewed:', error);
    }
  }
}));