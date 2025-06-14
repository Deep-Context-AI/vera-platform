"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  FileCheck, 
  Settings, 
  BarChart3, 
  Shield, 
  Bell,
  HelpCircle,
  Calendar,
  FileText,
  Search,
  Filter
} from 'lucide-react';
import { SidebarLink } from './sidebar';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

// Memoized icon components to prevent re-creation on every render
const ICONS = {
  home: <Home className="h-4 w-4" />,
  users: <Users className="h-4 w-4" />,
  fileCheck: <FileCheck className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  barChart: <BarChart3 className="h-4 w-4" />,
  shield: <Shield className="h-4 w-4" />,
  bell: <Bell className="h-4 w-4" />,
  helpCircle: <HelpCircle className="h-4 w-4" />,
  calendar: <Calendar className="h-4 w-4" />,
  fileText: <FileText className="h-4 w-4" />,
  search: <Search className="h-4 w-4" />,
  filter: <Filter className="h-4 w-4" />,
} as const;

// Memoized sidebar configurations to prevent recreation
const SIDEBAR_CONFIGS = {
  dashboard: [
    { label: 'Overview', href: '/', icon: ICONS.home },
    { label: 'Analytics', href: '/analytics', icon: ICONS.barChart },
    { label: 'Practitioners', href: '/practitioners', icon: ICONS.users },
    { label: 'Recent Activity', href: '/activity', icon: ICONS.bell },
    { label: 'Reports', href: '/reports', icon: ICONS.fileText },
  ],
  verification: [
    { label: 'Pending Reviews', href: '/verification/pending', icon: ICONS.fileCheck },
    { label: 'Verified', href: '/verification/verified', icon: ICONS.shield },
    { label: 'Search Credentials', href: '/verification/search', icon: ICONS.search },
    { label: 'Filters', href: '/verification/filters', icon: ICONS.filter },
    { label: 'Bulk Actions', href: '/verification/bulk', icon: ICONS.fileText },
  ],
  practitioners: [
    { label: 'All Practitioners', href: '/practitioners', icon: ICONS.users },
    { label: 'Add New', href: '/practitioners/new', icon: ICONS.users },
    { label: 'Import', href: '/practitioners/import', icon: ICONS.fileText },
    { label: 'Categories', href: '/practitioners/categories', icon: ICONS.filter },
    { label: 'Schedule', href: '/practitioners/schedule', icon: ICONS.calendar },
  ],
  settings: [
    { label: 'General', href: '/settings', icon: ICONS.settings },
    { label: 'Organization', href: '/settings/organization', icon: ICONS.shield },
    { label: 'Users & Permissions', href: '/settings/users', icon: ICONS.users },
    { label: 'Notifications', href: '/settings/notifications', icon: ICONS.bell },
    { label: 'Help & Support', href: '/settings/help', icon: ICONS.helpCircle },
  ],
  default: [
    { label: 'Dashboard', href: '/', icon: ICONS.home },
    { label: 'Practitioners', href: '/practitioners', icon: ICONS.users },
    { label: 'Verification', href: '/verification', icon: ICONS.fileCheck },
    { label: 'Settings', href: '/settings', icon: ICONS.settings },
  ],
} as const;

const getSidebarConfig = (pathname: string): readonly SidebarItem[] => {
  if (pathname === '/' || pathname.startsWith('/dashboard')) {
    return SIDEBAR_CONFIGS.dashboard;
  } else if (pathname.startsWith('/verification')) {
    return SIDEBAR_CONFIGS.verification;
  } else if (pathname.startsWith('/practitioners')) {
    return SIDEBAR_CONFIGS.practitioners;
  } else if (pathname.startsWith('/settings')) {
    return SIDEBAR_CONFIGS.settings;
  } else {
    return SIDEBAR_CONFIGS.default;
  }
};

const LoadingSkeleton = React.memo(() => (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-2 py-2">
        <div className="h-4 w-4 bg-neutral-300 dark:bg-neutral-600 rounded animate-pulse" />
        <div className="h-4 w-24 bg-neutral-300 dark:bg-neutral-600 rounded animate-pulse" />
      </div>
    ))}
  </div>
));

LoadingSkeleton.displayName = "LoadingSkeleton";

const DynamicSidebarContent: React.FC = React.memo(() => {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  
  // Memoize sidebar items based on pathname
  const sidebarItems = useMemo(() => getSidebarConfig(pathname), [pathname]);

  // Memoized loading effect
  const startLoading = useCallback(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800); // Simulate loading delay
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const cleanup = startLoading();
    return cleanup;
  }, [pathname, startLoading]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-1">
      {sidebarItems.map((item) => (
        <SidebarLink
          key={item.href}
          link={item}
          className="hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md px-2"
        />
      ))}
    </div>
  );
});

DynamicSidebarContent.displayName = "DynamicSidebarContent";

export default DynamicSidebarContent; 