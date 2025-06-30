"use client";

import React, { useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  FileCheck, 
  Settings, 
  BarChart3, 
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Gavel,
  Mail,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useSidebar } from './sidebar';

// Memoized icon components to prevent re-creation
const ICONS = {
  home: <Home className="h-5 w-5" />,
  users: <Users className="h-5 w-5" />,
  fileCheck: <FileCheck className="h-5 w-5" />,
  settings: <Settings className="h-5 w-5" />,
  barChart: <BarChart3 className="h-5 w-5" />,
  search: <Search className="h-5 w-5" />,
  gavel: <Gavel className="h-5 w-5" />,
  mail: <Mail className="h-5 w-5" />,
  workflow: <Settings className="h-5 w-5" />,
} as const;

const getPageInfo = (pathname: string) => {
  if (pathname === '/' || pathname.startsWith('/dashboard')) {
    return { icon: ICONS.home, name: 'Dashboard' };
  } else if (pathname.startsWith('/committee') || pathname.startsWith('/providers')) {
    return { icon: ICONS.users, name: 'Providers' };
  } else if (pathname.startsWith('/inbox')) {
    return { icon: ICONS.mail, name: 'Inbox' };
  } else if (pathname.startsWith('/verification')) {
    return { icon: ICONS.fileCheck, name: 'Verification' };
  } else if (pathname.startsWith('/practitioners')) {
    return { icon: ICONS.users, name: 'Practitioners' };
  } else if (pathname.startsWith('/workflows')) {
    return { icon: ICONS.workflow, name: 'Workflows' };
  } else if (pathname.startsWith('/settings')) {
    return { icon: ICONS.settings, name: 'Settings' };
  } else if (pathname.startsWith('/analytics')) {
    return { icon: ICONS.barChart, name: 'Analytics' };
  } else if (pathname.startsWith('/playground')) {
    return { icon: ICONS.search, name: 'Playground' };
  } else {
    return { icon: ICONS.home, name: 'Dashboard' };
  }
};

const SidebarHeader: React.FC = React.memo(() => {
  const pathname = usePathname();
  const { open, setOpen } = useSidebar();
  
  // Memoize page info to prevent unnecessary recalculations
  const pageInfo = useMemo(() => getPageInfo(pathname), [pathname]);
  
  // Memoize toggle function
  const toggleSidebar = useCallback(() => {
    setOpen(!open);
  }, [open, setOpen]);

  // Memoize animation variants for text fade
  const textVariants = useMemo(() => ({
    open: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut" as const,
      }
    },
    closed: {
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: "easeInOut" as const,
      }
    }
  }), []);

  return (
    <div className="py-2 px-4 ">
      {open ? (
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-between hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-left p-1 rounded-md"
          aria-label="Collapse sidebar"
        >
          <div className="flex items-center gap-3 min-w-0 overflow-hidden">
            <div className="flex-shrink-0 text-neutral-600 dark:text-neutral-400">
              {pageInfo.icon}
            </div>
            <motion.h2
              variants={textVariants}
              initial="closed"
              animate={open ? "open" : "closed"}
              className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 truncate whitespace-nowrap"
            >
              {pageInfo.name}
            </motion.h2>
          </div>
          
          <div className="flex-shrink-0 p-1.5 rounded-md text-neutral-600 dark:text-neutral-400">
            <PanelLeftClose className="h-4 w-4" />
          </div>
        </button>
      ) : (
        <div className="flex items-center justify-center p-1">
          <button
            onClick={toggleSidebar}
            className="flex-shrink-0 p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
});

SidebarHeader.displayName = "SidebarHeader";

export default SidebarHeader; 