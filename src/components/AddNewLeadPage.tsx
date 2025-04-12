import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { AddNewLeadForm } from './AddNewLeadForm';
import { useNavigate } from 'react-router-dom';

export function AddNewLeadPage() {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-6">
        <button
          onClick={handleClose}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Dashboard
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md">
        <AddNewLeadForm onClose={handleClose} standalone={true} />
      </div>
    </div>
  );
}