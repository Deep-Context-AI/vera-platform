"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, User, Sun, Moon, Monitor } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  const [selectedOrg, setSelectedOrg] = useState("Vera Platform");
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  const organizations = [
    "Vera Platform",
    "Healthcare Partners",
    "Medical Associates",
    "Wellness Group"
  ];

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

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

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

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
          href="/workflows"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          Workflows
        </Link>
        <Link
          href="/settings"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          Settings
        </Link>
        
        {/* User Avatar with Theme Toggle Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-100 dark:focus:ring-offset-neutral-800">
              <User className="h-4 w-4 text-white" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="end">
            <div className="space-y-1">
              <div className="px-2 py-1.5 text-sm font-medium text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-700 mb-2">
                Theme
              </div>
              {mounted && themeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors text-left",
                      theme === option.value
                        ? "bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                        : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </nav>
    </header>
  );
};

export default Header; 