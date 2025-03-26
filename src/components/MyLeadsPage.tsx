import React, { useState, useEffect } from 'react';
import { useLeadStore } from '../store/useLeadStore';
import { useAuthStore } from '../store/useAuthStore';
import { Search, Download, Plus, ChevronDown, ChevronUp, LayoutGrid, LayoutList, Filter, Star, Edit, Trash2 } from 'lucide-react';
import { DndContext, DragEndEvent, closestCenter, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { LeadCard } from './LeadCard';
import { LeadColumn } from './LeadColumn';
import { AddLeadModal } from './AddLeadModal';
import { LeadStatistics } from './LeadStatistics';
import { format } from 'date-fns';

function formatPhoneNumber(phone: string) {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return phone;
}

export function MyLeadsPage() {
  const { user, impersonatedUser } = useAuthStore();
  const { leads, isLoading, error, fetchLeads, updateLeadStatus, updateLeadNotes } = useLeadStore();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    study: '',
    protocol: '',
    site: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'createdAt', direction: 'desc' });

  const effectiveUser = impersonatedUser || user;

  useEffect(() => {
    if (effectiveUser?.id) {
      fetchLeads(effectiveUser.id);
    }
  }, [effectiveUser?.id]);

  // Get unique values for filters
  const studies = Array.from(new Set(leads.map(lead => lead.indication).filter(Boolean)));
  const protocols = Array.from(new Set(leads.map(lead => lead.protocol).filter(Boolean)));
  const sites = Array.from(new Set(leads.map(lead => lead.site).filter(Boolean)));

  const filteredLeads = leads.filter(lead => {
    const searchMatch = 
      `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.indication?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.protocol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.site?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const studyMatch = !filters.study || lead.indication === filters.study;
    const protocolMatch = !filters.protocol || lead.protocol === filters.protocol;
    const siteMatch = !filters.site || lead.site === filters.site;

    return searchMatch && studyMatch && protocolMatch && siteMatch;
  }).sort((a, b) => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    switch (sortConfig.key) {
      case 'name':
        return direction * (`${a.firstName} ${a.lastName}`).localeCompare(`${b.firstName} ${b.lastName}`);
      case 'createdAt':
        return direction * (a.createdAt.getTime() - b.createdAt.getTime());
      case 'status':
        return direction * a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (over && active.id !== over.id) {
      const leadId = active.id as string;
      const newStatus = over.id as string;
      try {
        await updateLeadStatus(leadId, newStatus as any);
      } catch (error) {
        console.error('Error updating lead status:', error);
      }
    }
  };

  const handleAddNote = async (leadId: string, note: string) => {
    try {
      await updateLeadNotes(leadId, note);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const statusColumns = [
    { status: 'new', title: 'New Leads' },
    { status: 'not_contacted', title: 'Not Contacted' },
    { status: 'contacted', title: 'Contacted' },
    { status: 'qualified', title: 'Qualified' },
    { status: 'converted', title: 'Converted' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Leads</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            {viewMode === 'list' ? (
              <><LayoutGrid className="w-5 h-5 mr-2" /> Kanban View</>
            ) : (
              <><LayoutList className="w-5 h-5 mr-2" /> List View</>
            )}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Lead
          </button>
        </div>
      </div>

      <LeadStatistics leads={leads} />

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex space-x-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search leads by name, study, protocol, or site..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
            {showFilters ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Study</label>
              <select
                value={filters.study}
                onChange={(e) => setFilters({ ...filters, study: e.target.value })}
                className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Studies</option>
                {studies.map(study => (
                  <option key={study} value={study}>{study}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Protocol</label>
              <select
                value={filters.protocol}
                onChange={(e) => setFilters({ ...filters, protocol: e.target.value })}
                className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Protocols</option>
                {protocols.map(protocol => (
                  <option key={protocol} value={protocol}>{protocol}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
              <select
                value={filters.site}
                onChange={(e) => setFilters({ ...filters, site: e.target.value })}
                className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Sites</option>
                {sites.map(site => (
                  <option key={site} value={site}>{site}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* List/Kanban Views */}
      {viewMode === 'list' ? (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Patient</span>
                    {sortConfig.key === 'name' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Study Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Status</span>
                    {sortConfig.key === 'status' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('createdAt')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Created</span>
                    {sortConfig.key === 'createdAt' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {lead.firstName} {lead.lastName}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      <div>{formatPhoneNumber(lead.phone)}</div>
                      <div>{lead.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{lead.indication || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{lead.protocol || 'No protocol'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                      lead.status === 'not_contacted' ? 'bg-yellow-100 text-yellow-800' :
                      lead.status === 'contacted' ? 'bg-green-100 text-green-800' :
                      lead.status === 'qualified' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(lead.createdAt, 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleAddNote(lead.id, '')}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <DndContext 
          collisionDetection={closestCenter} 
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {statusColumns.map(({ status, title }) => {
              const columnLeads = filteredLeads.filter(lead => lead.status === status);
              return (
                <LeadColumn
                  key={status}
                  status={status}
                  title={title}
                  count={columnLeads.length}
                >
                  <SortableContext
                    items={columnLeads.map(lead => lead.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {columnLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onAddNote={handleAddNote}
                      />
                    ))}
                  </SortableContext>
                </LeadColumn>
              );
            })}
          </div>

          <DragOverlay>
            {activeId ? (
              <LeadCard
                lead={leads.find(l => l.id === activeId)!}
                onAddNote={handleAddNote}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {showAddModal && (
        <AddLeadModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}