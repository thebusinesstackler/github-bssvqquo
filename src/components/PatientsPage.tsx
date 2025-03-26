import React, { useState } from 'react';
import { Search, Download, FileText, Plus, ChevronDown } from 'lucide-react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Patient, PatientStatus } from '../types';
import { usePatientStore } from '../store/usePatientStore';
import { PatientCard } from '../components/PatientCard';
import { PatientColumn } from '../components/PatientColumn';

export function PatientsPage() {
  const { patients, sites, protocols, indications, updatePatient } = usePatientStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState<string>('');
  const [selectedSite, setSelectedSite] = useState<string>('');

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm);
    
    const matchesProtocol = !selectedProtocol || patient.protocol === selectedProtocol;
    const matchesSite = !selectedSite || patient.site === selectedSite;

    return matchesSearch && matchesProtocol && matchesSite;
  });

  const columns: { status: PatientStatus; title: string }[] = [
    { status: 'ineligible', title: 'Ineligible' },
    { status: 'screening', title: 'Screening' },
    { status: 'eligible', title: 'Potential Participant' },
    { status: 'randomized', title: 'Randomized' },
    { status: 'completed', title: 'Screen Failed' }
  ];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const patientId = active.id as string;
      const newStatus = over.id as PatientStatus;
      
      updatePatient(patientId, { status: newStatus });
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <select
            value={selectedProtocol}
            onChange={(e) => setSelectedProtocol(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Protocols</option>
            {protocols.map(protocol => (
              <option key={protocol.id} value={protocol.id}>{protocol.name}</option>
            ))}
          </select>

          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Sites</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center">
            <Download className="w-5 h-5 mr-2" />
            Download Patients
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Add Patient
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {columns.map(({ status, title }) => {
            const columnPatients = filteredPatients.filter(p => p.status === status);
            
            return (
              <PatientColumn
                key={status}
                status={status}
                title={title}
                count={columnPatients.length}
              >
                <SortableContext 
                  items={columnPatients.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {columnPatients.map((patient) => (
                    <PatientCard
                      key={patient.id}
                      patient={patient}
                    />
                  ))}
                </SortableContext>
              </PatientColumn>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}