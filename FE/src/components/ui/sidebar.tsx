"use client";

import { cn } from "@/lib/utils";
import Link, { LinkProps } from "next/link";
import React, { useState, createContext, useContext, useMemo, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { setSidebarStateCookie } from "@/lib/sidebar-state";

// Enhanced hook that works with both localStorage and cookies
function useSidebarState(key: string, defaultValue: boolean, initialServerState?: boolean) {
  // Use server state if provided, otherwise use default
  const [value, setValue] = useState(initialServerState ?? defaultValue);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // After mounting, sync with localStorage if different from server state
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        const storedValue = JSON.parse(item);
        if (storedValue !== value) {
          setValue(storedValue);
        }
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
  }, [key, value]);

  const setStoredValue = useCallback((newValue: boolean | ((val: boolean) => boolean)) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      
      if (mounted && typeof window !== 'undefined') {
        // Update both localStorage and cookie
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        setSidebarStateCookie(valueToStore);
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, value, mounted]);

  return [value, setStoredValue, mounted] as const;
}

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = React.memo(({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
  initialServerState,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
  initialServerState?: boolean;
}) => {
  const [openState, setOpenState, mounted] = useSidebarState('sidebar-open', true, initialServerState);

  const open = openProp !== undefined ? openProp : openState;
  
  const setOpen = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    const newValue = typeof value === 'function' ? value(open) : value;
    
    if (setOpenProp) {
      setOpenProp(newValue);
    } else {
      setOpenState(newValue);
    }
  }, [open, setOpenProp, setOpenState]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    open,
    setOpen,
    animate: animate && mounted // Don't animate until mounted to prevent flash
  }), [open, setOpen, animate, mounted]);

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
});

SidebarProvider.displayName = "SidebarProvider";

export const Sidebar = React.memo(({
  children,
  open,
  setOpen,
  animate,
  initialServerState,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
  initialServerState?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate} initialServerState={initialServerState}>
      {children}
    </SidebarProvider>
  );
});

Sidebar.displayName = "Sidebar";

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = React.memo(({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, animate } = useSidebar();
  
  // Memoize animation config to prevent unnecessary re-renders
  const animationConfig = useMemo(() => ({
    width: open ? "225px" : "60px",
  }), [open]);

  // Memoize transition config - disable transition on initial render
  const transition = useMemo(() => ({
    duration: animate ? 0.3 : 0,
    ease: "easeInOut" as const,
  }), [animate]);

  return (
    <motion.div
      className={cn(
        "h-full hidden md:flex md:flex-col bg-neutral-100 dark:bg-neutral-800 flex-shrink-0",
        className
      )}
      initial={animationConfig} // Start with the correct state based on server/cookie state
      animate={animationConfig}
      transition={transition}
      {...props}
    >
      {children}
    </motion.div>
  );
});

DesktopSidebar.displayName = "DesktopSidebar";

export const MobileSidebar = React.memo(({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  
  const toggleSidebar = useCallback(() => {
    setOpen(!open);
  }, [open, setOpen]);

  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-neutral-100 dark:bg-neutral-800 w-full"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <Menu
            className="text-neutral-800 dark:text-neutral-200 cursor-pointer"
            onClick={toggleSidebar}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-white dark:bg-neutral-900 p-10 z-[100] flex flex-col justify-between",
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                onClick={toggleSidebar}
              >
                <X />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
});

MobileSidebar.displayName = "MobileSidebar";

export const SidebarLink = React.memo(({
  link,
  className,
  isActive = false,
  ...props
}: {
  link: Links;
  className?: string;
  isActive?: boolean;
  props?: LinkProps;
}) => {
  const { open, animate } = useSidebar();
  
  // Memoize the icon to prevent re-renders
  const memoizedIcon = useMemo(() => link.icon, [link.icon]);
  
  // Improved animation config for smoother text transitions
  const textAnimation = useMemo(() => ({
    opacity: animate ? (open ? 1 : 0) : 1,
    width: animate ? (open ? "auto" : "0px") : "auto",
    marginLeft: animate ? (open ? "8px" : "0px") : "8px",
  }), [animate, open]);

  const textTransition = useMemo(() => ({
    duration: 0.3,
    ease: "easeInOut" as const,
  }), []);

  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center justify-start group/sidebar py-2",
        isActive && "bg-neutral-200 dark:bg-neutral-700",
        className
      )}
      {...props}
    >
      <div className="flex-shrink-0">
        {memoizedIcon}
      </div>
      <motion.span
        animate={textAnimation}
        transition={textTransition}
        className={cn(
          "text-sm whitespace-nowrap overflow-hidden",
          isActive 
            ? "text-neutral-900 dark:text-neutral-100 font-medium" 
            : "text-neutral-700 dark:text-neutral-200"
        )}
      >
        {link.label}
      </motion.span>
    </Link>
  );
});

SidebarLink.displayName = "SidebarLink"; 