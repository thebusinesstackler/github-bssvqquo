import { create } from 'zustand';
import { Lead, LeadStatus, LeadQuality, LeadAssignment } from '../types';
import { db, auth } from '../lib/firebase';
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
  deleteDoc,
  limit,
  startAfter,
  setDoc
} from 'firebase/firestore';

interface LeadStore {
  leads: Lead[];
  isLoading: boolean;
  error: string | null;
  fetchLeads: (userId: string) => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'lastUpdated'>) => Promise<void>;
  updateLeadStatus: (leadId: string, status: LeadStatus) => Promise<void>;
  updateLeadNotes: (leadId: string, note: string) => Promise<void>;
  reassignLead: (leadId: string, partnerId: string, reason?: string) => Promise<void>;
  markLeadViewed: (leadId: string) => Promise<void>;
  updateLeadQuality: (leadId: string, quality: LeadQuality) => Promise<void>;
  getLeadHistory: (leadId: string) => Promise<Lead | null>;
  getPartnerLeadMetrics: (partnerId: string) => Promise<{
    total: number;
    byStatus: Record<LeadStatus, number>;
    byQuality: Record<LeadQuality, number>;
  }>;
  getLeadsByPartnerPaginated: (partnerId: string, lastLead?: Lead, pageSize?: number) => Promise<Lead[]>;
  setLeads: (leads: Lead[]) => void;
}

export const useLeadStore = create<LeadStore>((set, get) => ({
  leads: [],
  isLoading: false,
  error: null,

  fetchLeads: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Validate userId and auth
      if (!userId) {
        console.error('fetchLeads: userId is null or undefined');
        set({ isLoading: false, leads: [], error: 'User ID is required' });
        return;
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('fetchLeads: No authenticated user');
        set({ isLoading: false, leads: [], error: 'User not authenticated' });
        return;
      }

      console.log(`fetchLeads: Current auth user: ${currentUser.uid}, Requested userId: ${userId}`);
      
      // Ensure the user is only fetching their own leads or is an admin
      if (currentUser.uid !== userId) {
        // Check if current user is admin
        const currentUserDoc = await getDoc(doc(db, 'partners', currentUser.uid));
        const isCurrentUserAdmin = currentUserDoc.exists() && 
            (currentUserDoc.data().role === 'admin' || 
             currentUserDoc.data().email === 'theranovex@gmail.com' || 
             currentUserDoc.data().email === 'digitaltackler@gmail.com');
        
        if (!isCurrentUserAdmin) {
          console.error(`fetchLeads: Permission denied. User ${currentUser.uid} attempted to fetch leads for ${userId}`);
          set({ 
            isLoading: false, 
            leads: [], 
            error: 'You do not have permission to access these leads' 
          });
          return;
        }
      }
      
      // Get user document
      const userDoc = await getDoc(doc(db, 'partners', userId));
      
      // Handle non-existent user gracefully
      if (!userDoc.exists()) {
        console.log(`Creating new user document for ${userId}`);
        // Create the user document for later use
        await setDoc(doc(db, 'partners', userId), {
          id: userId,
          name: auth.currentUser?.displayName || 'New User',
          email: auth.currentUser?.email,
          role: auth.currentUser?.email === 'theranovex@gmail.com' || auth.currentUser?.email === 'digitaltackler@gmail.com' ? 'admin' : 'partner',
          active: true,
          createdAt: serverTimestamp(),
          subscription: 'none',
          maxLeads: 50,
          currentLeads: 0
        });
        
        // After creating the user document, continue with empty leads array
        // instead of returning early
        set({ leads: [], isLoading: false });
        return;
      }

      const userData = userDoc.data();
      const isAdmin = userData?.role === 'admin' || userData?.email === 'theranovex@gmail.com' || userData?.email === 'digitaltackler@gmail.com';
      console.log(`User ${userId} isAdmin: ${isAdmin}`);
      
      let leads: Lead[] = [];

      if (isAdmin) {
        // Admin can see all leads across all partners
        const partnersSnapshot = await getDocs(collection(db, 'partners'));
        for (const partnerDoc of partnersSnapshot.docs) {
          // Skip admin document
          if (partnerDoc.id === 'admin') continue;

          // Check if the partner has leads subcollection
          try {
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
          } catch (err) {
            console.warn(`No leads found for partner ${partnerDoc.id}`);
          }
        }
      } else {
        // Partners can only see their own leads
        try {
          console.log(`Fetching leads for partner ${userId}`);
          
          // Create the leads subcollection if it doesn't exist
          // This is needed for partners who don't have any leads yet
          const leadsCollectionRef = collection(db, 'partners', userId, 'leads');
          
          // Try to get the leads
          const leadsSnapshot = await getDocs(
            query(leadsCollectionRef, orderBy('createdAt', 'desc'))
          );
          
          leads = leadsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            partnerId: userId,
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
            lastViewed: doc.data().lastViewed?.toDate() || null
          })) as Lead[];
          
          console.log(`Found ${leads.length} leads for partner ${userId}`);
        } catch (err) {
          console.error(`Error fetching leads for partner ${userId}:`, err);
          // If there's an error fetching leads, return an empty array instead of throwing
          leads = [];
        }
      }

      set({ leads, isLoading: false, error: null });
    } catch (error) {
      console.error('Error fetching leads:', error);
      // More descriptive error message for permissions issues
      let errorMessage = 'Failed to fetch leads';
      if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
          errorMessage = 'Missing or insufficient permissions. Please make sure you are properly authenticated and have access to this data.';
        }
      }
      
      set({ 
        leads: [],
        error: errorMessage, 
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

      // Check current user
      const user = auth.currentUser;
      console.log('Current auth user:', user?.uid, user?.email);
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Get partner document first to make sure it exists
      const partnerRef = doc(db, 'partners', partnerId);
      const partnerDoc = await getDoc(partnerRef);
      
      // If partner doc doesn't exist, create it
      if (!partnerDoc.exists()) {
        await setDoc(partnerRef, {
          id: partnerId,
          name: 'Partner',
          email: '',
          role: 'partner',
          active: true,
          createdAt: serverTimestamp(),
          subscription: 'none',
          maxLeads: 50,
          currentLeads: 0
        });
      }
      
      // Create leads subcollection if it doesn't exist
      const leadsCollection = collection(db, `partners/${partnerId}/leads`);
      
      // Create a new lead with all necessary fields
      const newLead = {
        ...leadFields,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        assignedBy: user.uid,
        quality: leadData.quality || 'warm',
        status: leadData.status || 'new',
        assignmentHistory: [{
          toPartnerId: partnerId,
          assignedBy: user.uid,
          assignedAt: Timestamp.now(),
          reason: leadData.assignmentReason || 'Initial assignment'
        }]
      };
      
      // Add lead to Firestore under the partner's leads subcollection
      const docRef = await addDoc(leadsCollection, newLead);

      // Create notifications collection if it doesn't exist
      try {
        const notificationsCollection = collection(db, `partners/${partnerId}/notifications`);
        
        // Create notification for the new lead
        await addDoc(notificationsCollection, {
          partnerId,
          title: 'New Lead Added',
          message: `A new lead (${leadData.firstName} ${leadData.lastName}) has been added to your site${leadData.indication ? ` for ${leadData.indication}` : ''}.`,
          type: 'system',
          read: false,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('Failed to create notification:', err);
      }

      // Create a global notification for real-time updates
      try {
        await addDoc(collection(db, 'notifications'), {
          partnerId,
          title: 'New Lead Added',
          message: `A new lead (${leadData.firstName} ${leadData.lastName}) has been added to your site${leadData.indication ? ` for ${leadData.indication}` : ''}.`,
          type: 'system',
          read: false,
          createdBy: user.role === 'admin' ? 'admin' : 'partner',
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('Failed to create global notification:', err);
      }

      // Create messages collection if it doesn't exist
      try {
        const messagesCollection = collection(db, `partners/${partnerId}/messages`);
        
        // Add a message for the partner
        await addDoc(messagesCollection, {
          content: `New lead added: ${leadData.firstName} ${leadData.lastName}${leadData.indication ? ` - ${leadData.indication}` : ''}. Please review and contact the patient within 24 hours.`,
          senderId: 'system',
          recipientId: partnerId,
          timestamp: serverTimestamp(),
          read: false,
          leadId: docRef.id
        });
      } catch (err) {
        console.warn('Failed to create message:', err);
      }

      // Update partner's lead count
      try {
        const currentLeads = partnerDoc.data()?.currentLeads || 0;
        const maxLeads = partnerDoc.data()?.maxLeads || 50;
        
        await updateDoc(partnerRef, {
          currentLeads: currentLeads + 1,
          updatedAt: serverTimestamp(),
          quotaUtilization: Math.round(((currentLeads + 1) / maxLeads) * 100)
        });
      } catch (err) {
        console.warn('Failed to update partner lead count:', err);
      }

      // Create a local lead object to update state
      const newLeadWithId = {
        id: docRef.id,
        ...leadData,
        createdAt: new Date(),
        lastUpdated: new Date(),
        assignedBy: user.uid,
        quality: leadData.quality || 'warm',
        status: leadData.status || 'new',
        assignmentHistory: [{
          toPartnerId: partnerId,
          assignedBy: user.uid,
          assignedAt: new Date(),
          reason: leadData.assignmentReason || 'Initial assignment'
        }]
      } as Lead;

      set(state => ({
        leads: [newLeadWithId, ...state.leads],
        isLoading: false,
        error: null
      }));
      
      console.log('Lead added successfully:', docRef.id);
    } catch (error) {
      console.error('Error adding lead:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add lead', 
        isLoading: false 
      });
      throw error;
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

      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const leadRef = doc(db, 'partners', lead.partnerId, 'leads', leadId);
      await updateDoc(leadRef, {
        status,
        lastUpdated: serverTimestamp(),
        statusHistory: arrayUnion({
          status,
          timestamp: Timestamp.now(),
          updatedBy: user.uid
        })
      });

      // Create a notification for status change
      try {
        await addDoc(collection(db, 'partners', lead.partnerId, 'notifications'), {
          partnerId: lead.partnerId,
          title: 'Lead Status Updated',
          message: `The status of lead "${lead.firstName} ${lead.lastName}" has been updated to ${status.replace('_', ' ')}.`,
          type: 'system',
          read: false,
          createdAt: serverTimestamp(),
          leadId
        });
      } catch (err) {
        console.warn('Failed to create notification:', err);
      }

      // Update the local state with the new status
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
        lastUpdated: serverTimestamp(),
      });

      // Update the lead in local state
      set(state => ({
        leads: state.leads.map(l => 
          l.id === leadId 
            ? {...l, notes: note, lastUpdated: new Date()}
            : l
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

  reassignLead: async (leadId: string, newPartnerId: string, reason?: string) => {
    set({ isLoading: true, error: null });
    try {
      // First find the lead to get the current partnerId
      const lead = get().leads.find(l => l.id === leadId);
      if (!lead?.partnerId) {
        throw new Error('Lead not found or missing partner ID');
      }

      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const oldPartnerId = lead.partnerId;

      // Get the lead data
      const oldLeadRef = doc(db, 'partners', lead.partnerId, 'leads', leadId);
      const leadDoc = await getDoc(oldLeadRef);
      if (!leadDoc.exists()) {
        throw new Error('Lead document not found');
      }

      // Create new assignment history entry
      const newAssignment: LeadAssignment = {
        fromPartnerId: oldPartnerId,
        toPartnerId: newPartnerId,
        assignedBy: user.uid,
        assignedAt: new Date(),
        reason: reason || 'Reassignment'
      };

      // Check if new partner document exists, create if not
      const newPartnerRef = doc(db, 'partners', newPartnerId);
      const newPartnerDoc = await getDoc(newPartnerRef);
      if (!newPartnerDoc.exists()) {
        // Create partner document
        await setDoc(newPartnerRef, {
          id: newPartnerId,
          name: 'Partner',
          email: '',
          role: 'partner',
          active: true,
          createdAt: serverTimestamp(),
          subscription: 'none',
          maxLeads: 50,
          currentLeads: 0
        });
      }

      // Create leads collection for new partner if it doesn't exist
      const newLeadsRef = collection(db, 'partners', newPartnerId, 'leads');
      const leadData = leadDoc.data();
      const newLeadDoc = await addDoc(newLeadsRef, {
        ...leadData,
        lastUpdated: serverTimestamp(),
        partnerId: newPartnerId,
        assignmentHistory: [
          ...(leadData.assignmentHistory || []),
          {
            fromPartnerId: oldPartnerId,
            toPartnerId: newPartnerId,
            assignedBy: user.uid,
            assignedAt: Timestamp.now(),
            reason: reason || 'Reassignment'
          }
        ]
      });

      // Delete the lead from the old partner's collection
      await deleteDoc(oldLeadRef);

      // Update lead counts for both partners
      const oldPartnerRef = doc(db, 'partners', oldPartnerId);
      const oldPartnerDoc = await getDoc(oldPartnerRef);
      if (oldPartnerDoc.exists()) {
        const currentLeads = oldPartnerDoc.data().currentLeads || 0;
        if (currentLeads > 0) {
          const newLeadCount = currentLeads - 1;
          const maxLeads = oldPartnerDoc.data().maxLeads || 50;
          await updateDoc(oldPartnerRef, {
            currentLeads: newLeadCount,
            updatedAt: serverTimestamp(),
            quotaUtilization: (newLeadCount / maxLeads) * 100
          });
        }
      }

      if (newPartnerDoc.exists()) {
        const currentLeads = newPartnerDoc.data().currentLeads || 0;
        const newLeadCount = currentLeads + 1;
        const maxLeads = newPartnerDoc.data().maxLeads || 50;
        await updateDoc(newPartnerRef, {
          currentLeads: newLeadCount,
          updatedAt: serverTimestamp(),
          quotaUtilization: (newLeadCount / maxLeads) * 100
        });
      }

      // Create notifications collection for both partners if they don't exist
      try {
        // For the new partner
        await addDoc(collection(db, 'partners', newPartnerId, 'notifications'), {
          partnerId: newPartnerId,
          title: 'New Lead Assigned',
          message: `A lead (${lead.firstName} ${lead.lastName}) has been assigned to your site.`,
          type: 'system',
          read: false,
          createdAt: serverTimestamp(),
          leadId: newLeadDoc.id
        });

        // For the old partner
        await addDoc(collection(db, 'partners', oldPartnerId, 'notifications'), {
          partnerId: oldPartnerId,
          title: 'Lead Reassigned',
          message: `The lead "${lead.firstName} ${lead.lastName}" has been reassigned to another site.`,
          type: 'system',
          read: false,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('Failed to create notifications:', err);
      }

      set(state => ({
        leads: state.leads.map(l => 
          l.id === leadId
            ? { ...l, partnerId: newPartnerId, id: newLeadDoc.id, lastUpdated: new Date(), assignmentHistory: [...(l.assignmentHistory || []), newAssignment] }
            : l
        ),
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
  },

  updateLeadQuality: async (leadId: string, quality: LeadQuality) => {
    set({ isLoading: true, error: null });
    try {
      // First find the lead to get the partnerId
      const lead = get().leads.find(l => l.id === leadId);
      if (!lead?.partnerId) {
        throw new Error('Lead not found or missing partner ID');
      }

      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const leadRef = doc(db, 'partners', lead.partnerId, 'leads', leadId);
      await updateDoc(leadRef, {
        quality,
        lastUpdated: serverTimestamp(),
        qualityHistory: arrayUnion({
          quality,
          timestamp: Timestamp.now(),
          updatedBy: user.uid
        })
      });

      set(state => ({
        leads: state.leads.map(lead =>
          lead.id === leadId
            ? { ...lead, quality, lastUpdated: new Date() }
            : lead
        ),
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.error('Error updating lead quality:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update lead quality', 
        isLoading: false 
      });
      throw error;
    }
  },

  getLeadHistory: async (leadId: string) => {
    try {
      const lead = get().leads.find(l => l.id === leadId);
      if (!lead?.partnerId) {
        throw new Error('Lead not found or missing partner ID');
      }

      const leadRef = doc(db, 'partners', lead.partnerId, 'leads', leadId);
      const leadDoc = await getDoc(leadRef);
      
      if (!leadDoc.exists()) {
        return null;
      }

      const leadData = leadDoc.data();
      return {
        ...leadData,
        id: leadDoc.id,
        partnerId: lead.partnerId,
        createdAt: leadData.createdAt?.toDate() || new Date(),
        lastUpdated: leadData.lastUpdated?.toDate() || new Date(),
        lastViewed: leadData.lastViewed?.toDate() || null,
        assignmentHistory: leadData.assignmentHistory?.map((assignment: any) => ({
          ...assignment,
          assignedAt: assignment.assignedAt?.toDate() || new Date()
        })),
        statusHistory: leadData.statusHistory?.map((status: any) => ({
          ...status,
          timestamp: status.timestamp?.toDate() || new Date()
        }))
      } as Lead;
    } catch (error) {
      console.error('Error fetching lead history:', error);
      return null;
    }
  },

  getPartnerLeadMetrics: async (partnerId: string) => {
    try {
      // Check if partnerId is valid
      if (!partnerId) {
        console.error('Partner ID is null or undefined. Cannot get lead metrics.');
        return {
          total: 0,
          byStatus: {
            new: 0,
            not_contacted: 0,
            contacted: 0,
            qualified: 0,
            converted: 0,
            lost: 0
          },
          byQuality: {
            hot: 0,
            warm: 0,
            cold: 0
          }
        };
      }

      const leadsRef = collection(db, 'partners', partnerId, 'leads');
      const leadsSnapshot = await getDocs(leadsRef);
      
      const leads = leadsSnapshot.docs.map(doc => ({
        ...doc.data()
      }));

      const statusCounts: Record<LeadStatus, number> = {
        new: 0,
        not_contacted: 0,
        contacted: 0,
        qualified: 0,
        converted: 0,
        lost: 0
      };

      const qualityCounts: Record<LeadQuality, number> = {
        hot: 0,
        warm: 0,
        cold: 0
      };

      leads.forEach((lead) => {
        if (lead.status) {
          statusCounts[lead.status as LeadStatus] = (statusCounts[lead.status as LeadStatus] || 0) + 1;
        }
        if (lead.quality) {
          qualityCounts[lead.quality as LeadQuality] = (qualityCounts[lead.quality as LeadQuality] || 0) + 1;
        }
      });

      return {
        total: leads.length,
        byStatus: statusCounts,
        byQuality: qualityCounts
      };
    } catch (error) {
      console.error('Error fetching partner lead metrics:', error);
      return {
        total: 0,
        byStatus: {
          new: 0,
          not_contacted: 0,
          contacted: 0,
          qualified: 0,
          converted: 0,
          lost: 0
        },
        byQuality: {
          hot: 0,
          warm: 0,
          cold: 0
        }
      };
    }
  },

  getLeadsByPartnerPaginated: async (partnerId: string, lastLead?: Lead, pageSize: number = 10) => {
    try {
      const leadsRef = collection(db, 'partners', partnerId, 'leads');
      
      let q;
      if (lastLead) {
        q = query(
          leadsRef, 
          orderBy('createdAt', 'desc'),
          startAfter(Timestamp.fromDate(lastLead.createdAt)),
          limit(pageSize)
        );
      } else {
        q = query(
          leadsRef, 
          orderBy('createdAt', 'desc'),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        partnerId,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
        lastViewed: doc.data().lastViewed?.toDate() || null
      })) as Lead[];
    } catch (error) {
      console.error('Error fetching paginated leads:', error);
      return [];
    }
  },

  // Helper method to update local leads state
  setLeads: (leads: Lead[]) => {
    set({ leads });
  }
}));