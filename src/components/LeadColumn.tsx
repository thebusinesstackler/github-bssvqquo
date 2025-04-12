import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface LeadColumnProps {
  status: string;
  title: string;
  count: number;
  children: React.ReactNode;
}

export function LeadColumn({ status, title, count, children }: LeadColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  
  // Add styling for when a card is being dragged over this column
  const columnStyle = isOver 
    ? { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' } // Blue highlight when dragging over
    : {};

  return (
    <div 
      ref={setNodeRef} 
      className="flex-1 min-w-[300px] bg-gray-50 rounded-lg p-4 border-2 border-transparent transition-colors duration-200"
      style={columnStyle}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medium text-gray-900">{title}</h2>
        <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">
          {count}
        </span>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}