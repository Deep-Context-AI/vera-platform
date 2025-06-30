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
  Filter,
  Gavel,
  Mail,
  Send,
  Archive,
  Star,
  Reply
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
  gavel: <Gavel className="h-4 w-4" />,
  mail: <Mail className="h-4 w-4" />,
  send: <Send className="h-4 w-4" />,
  archive: <Archive className="h-4 w-4" />,
  star: <Star className="h-4 w-4" />,
  reply: <Reply className="h-4 w-4" />,
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
  providers: [
    { label: 'Applications', href: '/providers', icon: ICONS.users },
    { label: 'Committee', href: '/providers/committee', icon: ICONS.gavel },
  ],
  committee: [
    { label: 'All Cases', href: '/providers/committee', icon: ICONS.gavel },
    { label: 'Ready for Review', href: '/providers/committee/ready', icon: ICONS.calendar },
    { label: 'Under Review', href: '/providers/committee/review', icon: ICONS.fileCheck },
    { label: 'Approved Cases', href: '/providers/committee/approved', icon: ICONS.shield },
    { label: 'Committee Schedule', href: '/providers/committee/schedule', icon: ICONS.calendar },
  ],
  inbox: [
    { label: 'All Messages', href: '/inbox', icon: ICONS.mail },
    { label: 'Unread', href: '/inbox/unread', icon: ICONS.bell },
    { label: 'Sent', href: '/inbox/sent', icon: ICONS.send },
    { label: 'Starred', href: '/inbox/starred', icon: ICONS.star },
    { label: 'Archive', href: '/inbox/archive', icon: ICONS.archive },
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
    { label: 'Providers', href: '/providers', icon: ICONS.users },
    { label: 'Inbox', href: '/inbox', icon: ICONS.mail },
    { label: 'Practitioners', href: '/practitioners', icon: ICONS.users },
    { label: 'Verification', href: '/verification', icon: ICONS.fileCheck },
    { label: 'Settings', href: '/settings', icon: ICONS.settings },
  ],
} as const;

const getSidebarConfig = (pathname: string): readonly SidebarItem[] => {
  if (pathname === '/' || pathname.startsWith('/dashboard')) {
    return SIDEBAR_CONFIGS.dashboard;
  } else if (pathname.startsWith('/providers/committee')) {
    return SIDEBAR_CONFIGS.committee;
  } else if (pathname.startsWith('/providers')) {
    return SIDEBAR_CONFIGS.providers;
  } else if (pathname.startsWith('/inbox')) {
    return SIDEBAR_CONFIGS.inbox;
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

// Function to determine if a route is active
const isRouteActive = (itemHref: string, currentPathname: string): boolean => {
  // Exact match for root paths
  if (itemHref === '/' && currentPathname === '/') {
    return true;
  }
  
  // For non-root paths
  if (itemHref !== '/') {
    // Exact match
    if (currentPathname === itemHref) {
      return true;
    }
    
    // Don't mark anything as active for detail pages (paths with IDs)
    // Check if current path looks like a detail page (e.g., /providers/123)
    const pathSegments = currentPathname.split('/').filter(Boolean);
    const itemSegments = itemHref.split('/').filter(Boolean);
    
    // If we're on a detail page (has more segments and the last segment looks like an ID)
    if (pathSegments.length > itemSegments.length) {
      const lastSegment = pathSegments[pathSegments.length - 1];
      // Check if the last segment is numeric (likely an ID) or looks like a UUID
      if (/^\d+$/.test(lastSegment) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastSegment)) {
        return false; // Don't highlight any sidebar item for detail pages
      }
    }
    
    return false;
  }
  
  return false;
};

const DynamicSidebarContent: React.FC = React.memo(() => {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  
  // Memoize sidebar items based on pathname
  const sidebarItems = useMemo(() => getSidebarConfig(pathname), [pathname]);

  // Memoized loading effect with fade-in animation
  const startLoading = useCallback(() => {
    setIsLoading(true);
    setIsVisible(false);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Add a small delay before showing content for smooth transition
      setTimeout(() => setIsVisible(true), 50);
    }, 800); // Simulate loading delay
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const cleanup = startLoading();
    return cleanup;
  }, [pathname, startLoading]);

  if (isLoading) {
    return (
      <div className="space-y-1 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-2 py-2 px-2">
            <div className="h-4 w-4 bg-neutral-300 dark:bg-neutral-600 rounded animate-pulse" />
            <div className="h-4 w-24 bg-neutral-300 dark:bg-neutral-600 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div 
      className={`space-y-1 transition-all duration-500 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-2'
      }`}
    >
      {sidebarItems.map((item, index) => (
        <div
          key={item.href}
          className={`transition-all duration-300 ease-out ${
            isVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-2'
          }`}
          style={{ 
            transitionDelay: isVisible ? `${index * 50}ms` : '0ms' 
          }}
        >
          <SidebarLink
            link={item}
            isActive={isRouteActive(item.href, pathname)}
            className="hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md px-2"
          />
        </div>
      ))}
    </div>
  );
});

DynamicSidebarContent.displayName = "DynamicSidebarContent";

export default DynamicSidebarContent; 