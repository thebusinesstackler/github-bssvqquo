import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, User, Phone, Mail, FileText, MessageSquare, X, Stethoscope } from 'lucide-react';
import { Lead } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { LeadDetailsModal } from './LeadDetailsModal';

interface LeadCardProps {
  lead: Lead;
  onAddNote?: (leadId: string, note: string) => void;
}

function formatPhoneNumber(phone: string) {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return phone;
}

export function LeadCard({ lead, onAddNote }: LeadCardProps) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    setActivatorNodeRef
  } = useSortable({ 
    id: lead.id,
    data: {
      type: 'card',
      status: lead.status,
      node: null // Will be set by ref
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform && {
      ...transform,
      scaleX: 1 - (Math.abs(transform.x) / 1000),
      scaleY: 1 - (Math.abs(transform.y) / 1000),
      rotate: transform.x / 20 // Slight rotation while dragging
    }),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteText.trim() && onAddNote) {
      onAddNote(lead.id, noteText.trim());
      setNoteText('');
      setShowNoteInput(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'not_contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'contacted':
        return 'bg-green-100 text-green-800';
      case 'qualified':
        return 'bg-purple-100 text-purple-800';
      case 'converted':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <div
        ref={(node) => {
          setNodeRef(node);
          // Store the DOM node in our data for column detection
          if (node) {
            node.setAttribute('data-card-id', lead.id);
            node.setAttribute('data-current-status', lead.status);
          }
        }}
        style={style}
        {...attributes}
        className={`bg-white rounded-lg shadow-md p-4 mb-4 relative ${
          isDragging ? 'rotate-3 scale-105' : ''
        } transition-all duration-200 hover:shadow-lg`}
      >

        {/* Drag Handle - Only this area triggers dragging */}
        {/* <div 
          ref={setActivatorNodeRef}
          {...listeners}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center cursor-move z-10"
          // style={{ zIndex: 1 }}
          onClick={(e) => e.stopPropagation()} // Prevent card click when dragging
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="w-4 h-4 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors" />
        </div> */}
        <div 
          ref={setActivatorNodeRef}
          {...listeners}
          className="absolute top-0 right-0 w-12 h-8 cursor-move"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-2 right-2 w-6 h-1 bg-gray-300 rounded-full" />
          <div className="absolute top-3.5 right-2 w-6 h-1 bg-gray-300 rounded-full" />
          <div className="absolute top-5 right-2 w-6 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Lead Information */}
        <div onClick={() => !isDragging && setShowDetails(true)} className="cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">{lead.firstName} {lead.lastName}</h3>
            <span className="text-sm text-gray-500 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {formatDistanceToNow(lead.createdAt, { addSuffix: true })}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-gray-600">
              <Stethoscope className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">{lead.indication || 'No indication'}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Phone className="w-4 h-4 mr-2" />
              <span className="text-sm">{formatPhoneNumber(lead.phone)}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Mail className="w-4 h-4 mr-2" />
              <span className="text-sm">{lead.email}</span>
            </div>
            {lead.protocol && (
              <div className="flex items-center text-gray-600">
                <FileText className="w-4 h-4 mr-2" />
                <span className="text-sm">Protocol: {lead.protocol}</span>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            {lead.notes && (
              <div className="mb-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {lead.notes}
              </div>
            )}
            
            {showNoteInput ? (
              <form onSubmit={handleSubmitNote} className="space-y-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onClick={(e => e.stopPropagation())}
                  placeholder="Add a note..."
                  className="w-full text-sm border border-gray-200 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNoteInput(false);
                    }}
                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!noteText.trim()}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Save Note
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex justify-between items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Add Note clicked');
                    setShowNoteInput(true);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Add Note
                </button>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status)}`}>
                  {lead.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      {showDetails && (
        <LeadDetailsModal
          lead={lead}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
}