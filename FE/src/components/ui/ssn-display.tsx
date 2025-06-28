'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from './button';

interface SSNDisplayProps {
  ssn: string | null | undefined;
  className?: string;
  showLabel?: boolean;
  labelText?: string;
}

const SSNDisplay: React.FC<SSNDisplayProps> = ({
  ssn,
  className = '',
  showLabel = false,
  labelText = 'SSN'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const formatSSN = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as XXX-XX-XXXX
    if (digits.length >= 9) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
    }
    return value;
  };

  const maskSSN = (value: string) => {
    const formatted = formatSSN(value);
    // Show only last 4 digits: ***-**-XXXX
    if (formatted.length >= 11) {
      return `***-**-${formatted.slice(-4)}`;
    }
    return '***-**-****';
  };

  if (!ssn) {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        {showLabel && (
          <span className="text-sm text-gray-500 dark:text-gray-400">{labelText}</span>
        )}
        <span className="text-sm text-gray-400 dark:text-gray-500">Not provided</span>
      </div>
    );
  }

  const displayValue = isVisible ? formatSSN(ssn) : maskSSN(ssn);

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {showLabel && (
        <span className="text-sm text-gray-500 dark:text-gray-400">{labelText}</span>
      )}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-900 dark:text-gray-100 font-mono">
          {displayValue}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(!isVisible)}
          className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
          title={isVisible ? 'Hide SSN' : 'Show SSN'}
        >
          {isVisible ? (
            <EyeOff className="h-3 w-3 text-gray-500" />
          ) : (
            <Eye className="h-3 w-3 text-gray-500" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default SSNDisplay; 