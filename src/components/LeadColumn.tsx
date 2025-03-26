import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface LeadColumnProps {
  status: string;
  title: string;
  count: number;
  children: React.ReactNode;
}

export function LeadColumn({ status, title, count, children }: LeadColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className="flex-1 min-w-[300px] bg-gray-50 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medium text-gray-900">{title}</h2>
        <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">
          {count}
        </span>
      </div>
      <div ref={setNodeRef} className="space-y-3">
        {children}
      </div>
    </div>
  );
}