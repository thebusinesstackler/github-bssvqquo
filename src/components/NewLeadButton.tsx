import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { AddNewLeadForm } from './AddNewLeadForm';
import { useNavigate, useLocation } from 'react-router-dom';

interface NewLeadButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  useModal?: boolean;
}

export function NewLeadButton({ 
  variant = 'primary', 
  size = 'medium',
  useModal = true
}: NewLeadButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    if (useModal) {
      setShowModal(true);
    } else {
      navigate('/leads/new');
    }
  };

  // Determine if we're already on the new lead page to avoid showing the button
  if (location.pathname === '/leads/new') {
    return null;
  }

  const sizeClasses = {
    small: 'px-2 py-1 text-sm',
    medium: 'px-4 py-2',
    large: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center rounded-lg transition-colors ${sizeClasses[size]} ${variantClasses[variant]}`}
      >
        <UserPlus className={`${size === 'small' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
        Add Lead
      </button>

      {useModal && showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <AddNewLeadForm onClose={() => setShowModal(false)} />
        </div>
      )}
    </>
  );
}