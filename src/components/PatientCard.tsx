import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, Phone } from 'lucide-react';
import { Patient } from '../types';
import { format } from 'date-fns';

interface PatientCardProps {
  patient: Patient;
}

export function PatientCard({ patient }: PatientCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: patient.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg shadow-sm p-4 mb-3 cursor-move hover:shadow-md"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium text-gray-900">
            {patient.firstName} {patient.lastName}
          </h3>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <Phone className="w-4 h-4 mr-1" />
            {patient.phone}
          </div>
        </div>
        <div className="flex items-center">
          <button className="text-gray-400 hover:text-gray-600">
            <FileText className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-2">
        {patient.indication}
      </div>

      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-500">
          {format(patient.lastUpdated, 'MMM d, yyyy')}
        </span>
        {patient.protocol && (
          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
            {patient.protocol}
          </span>
        )}
      </div>
    </div>
  );
}