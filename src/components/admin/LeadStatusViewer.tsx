import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAdminStore } from '../../store/useAdminStore';
import { format } from 'date-fns';
import { 
  Users, 
  Search, 
  RefreshCw, 
  Clock, 
  Phone, 
  Mail,
  Tag,
  BarChart,
  Filter,
  Calendar,
  MapPin,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface LeadStatusViewerProps {
  partnerId?: string;
  limit?: number;
}

export function LeadStatusViewer({ partnerId, limit = 10 }: LeadStatusViewerProps) {
  const { partners, fetchPartners } = useAdminStore();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<string>(partnerId || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (partners.length === 0) {
      fetchPartners();
    }
    
    if (partnerId) {
      setSelectedPartner(partnerId);
    }
  }, [partnerId, partners.length, fetchPartners]);

  useEffect(() => {
    let unsubscribe = () => {};
    
    const fetchLeads = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (selectedPartner === 'all') {
          // If viewing all partners, we'll fetch leads for each active partner
          const partnerIds = partners.filter(p => p.active).map(p => p.id);
          const allLeads: any[] = [];
          
          for (const pid of partnerIds) {
            // Get basic details about this partner
            const partner = partners.find(p => p.id === pid);
            
            const leadsRef = collection(db, `partners/${pid}/leads`);
            let q = query(leadsRef);
            
            if (selectedStatus !== 'all') {
              q = query(leadsRef, where('status', '==', selectedStatus));
            }
            
            // Create a one-time fetch for this partner's leads
            const snapshot = await getDoc(doc(db, 'partners', pid));
            if (snapshot.exists()) {
              const partnerDetails = snapshot.data();
              
              // Set up real-time listener for this partner
              const partnerUnsubscribe = onSnapshot(
                q,
                (querySnapshot) => {
                  const partnerLeads = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    partnerId: pid,
                    partnerName: partner?.name || 'Unknown Partner',
                    partnerEmail: partner?.email || '',
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                    lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
                  }));
                  
                  // Update the leads state by replacing this partner's leads
                  setLeads(current => {
                    // Remove old leads for this partner
                    const othersLeads = current.filter(l => l.partnerId !== pid);
                    // Add new leads
                    return [...othersLeads, ...partnerLeads]
                      .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
                  });
                  
                  setLoading(false);
                },
                (err) => {
                  console.error(`Error fetching leads for partner ${pid}:`, err);
                  setError(`Error fetching some leads. Please try again.`);
                  setLoading(false);
                }
              );
              
              return partnerUnsubscribe;
            }
          }
        } else {
          // Just get leads for the selected partner
          const leadsRef = collection(db, `partners/${selectedPartner}/leads`);
          let q = query(leadsRef);
          
          if (selectedStatus !== 'all') {
            q = query(leadsRef, where('status', '==', selectedStatus));
          }
          
          // Get the partner details
          const partner = partners.find(p => p.id === selectedPartner);
          
          unsubscribe = onSnapshot(
            q,
            (querySnapshot) => {
              const fetchedLeads = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                partnerId: selectedPartner,
                partnerName: partner?.name || 'Unknown Partner',
                partnerEmail: partner?.email || '',
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
              }));
              
              setLeads(fetchedLeads.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime()));
              setLoading(false);
            },
            (err) => {
              console.error('Error fetching leads:', err);
              setError('Failed to fetch leads. Please try again.');
              setLoading(false);
            }
          );
        }
      } catch (err) {
        console.error('Error setting up leads listener:', err);
        setError('An error occurred while loading leads');
        setLoading(false);
      }
    };
    
    fetchLeads();
    
    return () => unsubscribe();
  }, [partners, selectedPartner, selectedStatus]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Re-fetch partners first
    fetchPartners().then(() => {
      // The lead listener will automatically refresh when partners are updated
      setTimeout(() => setRefreshing(false), 500);
    }).catch(err => {
      console.error('Error refreshing data:', err);
      setRefreshing(false);
    });
  };

  // Filter leads based on search term
  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    return (
      lead.firstName?.toLowerCase().includes(searchLower) ||
      lead.lastName?.toLowerCase().includes(searchLower) ||
      `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchLower) ||
      lead.email?.toLowerCase().includes(searchLower) ||
      lead.phone?.includes(searchTerm) ||
      lead.indication?.toLowerCase().includes(searchLower) ||
      lead.partnerName?.toLowerCase().includes(searchLower)
    );
  }).slice(0, limit);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'not_contacted': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-green-100 text-green-800';
      case 'qualified': return 'bg-purple-100 text-purple-800';
      case 'converted': return 'bg-indigo-100 text-indigo-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="text-lg font-medium text-gray-900">
          {partnerId ? 'Partner Leads' : 'All Partner Leads'} <span className="text-gray-500 text-sm">- Real-Time</span>
        </h3>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
          >
            <Filter className="w-5 h-5" />
          </button>
          <button 
            onClick={handleRefresh}
            className={`p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="p-4 bg-gray-50 border-b space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {!partnerId && (
              <div className="w-full sm:w-auto">
                <select
                  value={selectedPartner}
                  onChange={(e) => setSelectedPartner(e.target.value)}
                  className="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Partners</option>
                  {partners.filter(p => p.active).map(partner => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="w-full sm:w-auto">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="not_contacted">Not Contacted</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-600">Loading leads...</span>
        </div>
      ) : error ? (
        <div className="p-6 flex items-center justify-center text-red-600">
          <AlertCircle className="w-6 h-6 mr-2" />
          <span>{error}</span>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="mt-2">No leads found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                {!partnerId && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Partner
                  </th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map(lead => (
                <tr key={`${lead.partnerId}-${lead.id}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {lead.firstName} {lead.lastName}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <MapPin className="w-3 h-3 mr-1" />
                          {lead.zipCode || 'No ZIP'}
                          
                          {lead.indication && (
                            <>
                              <span className="mx-1">•</span>
                              <Tag className="w-3 h-3 mr-1" />
                              {lead.indication}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {!partnerId && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.partnerName}</div>
                      <div className="text-xs text-gray-500">{lead.partnerEmail}</div>
                    </td>
                  )}
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {lead.phone || 'No phone'}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {lead.email || 'No email'}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                      {lead.status.split('_').map((word: string) => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-gray-400" />
                      {format(lead.lastUpdated, 'MMM d, yyyy h:mm a')}
                    </div>
                    <div className="text-xs text-gray-400">
                      Created: {format(lead.createdAt, 'MMM d, yyyy')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}