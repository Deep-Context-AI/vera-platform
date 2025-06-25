"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, User } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  const [selectedOrg, setSelectedOrg] = useState("Vera Platform");
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const organizations = [
    "Vera Platform",
    "Healthcare Partners",
    "Medical Associates",
    "Wellness Group"
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOrgDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className={cn(
      "px-6 py-2 flex items-center justify-between bg-neutral-100 dark:bg-neutral-800",
      className
    )}>
      {/* Left side - Organization Combobox */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors"
        >
          <span>{selectedOrg}</span>
          <ChevronDown className="h-4 w-4" />
        </button>
        
        {isOrgDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-lg z-50">
            {organizations.map((org) => (
              <button
                key={org}
                onClick={() => {
                  setSelectedOrg(org);
                  setIsOrgDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 first:rounded-t-md last:rounded-b-md"
              >
                {org}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right side - Navigation */}
      <nav className="flex items-center gap-6">
        <Link
          href="/"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/providers"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          Providers
        </Link>
        <Link
          href="/committee"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          Committee
        </Link>
        <Link
          href="/inbox"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          Inbox
        </Link>
        <Link
          href="/verification"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          Verification
        </Link>
        <Link
          href="/settings"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          Settings
        </Link>
        
        {/* User Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header; 