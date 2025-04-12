import React from 'react';
import { Flame, Thermometer, Snowflake } from 'lucide-react';
import { LeadQuality } from '../../types';

interface LeadQualityRatingProps {
  quality: LeadQuality;
  onQualityChange?: (quality: LeadQuality) => void;
  disabled?: boolean;
}

export function LeadQualityRating({ quality, onQualityChange, disabled = false }: LeadQualityRatingProps) {
  const handleChange = (newQuality: LeadQuality) => {
    if (disabled || !onQualityChange) return;
    onQualityChange(newQuality);
  };

  return (
    <div className="flex items-center space-x-1">
      <button
        type="button"
        onClick={() => handleChange('hot')}
        disabled={disabled}
        className={`p-1 rounded-md ${
          quality === 'hot' 
            ? 'text-red-500 bg-red-50'
            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title="Hot Lead"
      >
        <Flame className="w-5 h-5" />
      </button>
      
      <button
        type="button"
        onClick={() => handleChange('warm')}
        disabled={disabled}
        className={`p-1 rounded-md ${
          quality === 'warm' 
            ? 'text-yellow-500 bg-yellow-50'
            : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title="Warm Lead"
      >
        <Thermometer className="w-5 h-5" />
      </button>
      
      <button
        type="button"
        onClick={() => handleChange('cold')}
        disabled={disabled}
        className={`p-1 rounded-md ${
          quality === 'cold' 
            ? 'text-blue-500 bg-blue-50'
            : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title="Cold Lead"
      >
        <Snowflake className="w-5 h-5" />
      </button>
      
      <span className="text-xs text-gray-500 ml-1">
        {quality.charAt(0).toUpperCase() + quality.slice(1)}
      </span>
    </div>
  );
}