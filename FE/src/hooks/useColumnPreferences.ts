import { useState, useEffect, useCallback, useRef } from 'react';
import { VisibilityState } from '@tanstack/react-table';

interface UseColumnPreferencesOptions {
  tableId: string;
  defaultVisibility?: VisibilityState;
}

export function useColumnPreferences({ 
  tableId, 
  defaultVisibility = {} 
}: UseColumnPreferencesOptions) {
  // Use ref to store the initial default visibility to prevent re-renders
  const defaultVisibilityRef = useRef(defaultVisibility);
  
  // Only update the ref if the serialized version actually changed
  const serializedDefault = JSON.stringify(defaultVisibility);
  const prevSerializedRef = useRef(serializedDefault);
  
  if (prevSerializedRef.current !== serializedDefault) {
    defaultVisibilityRef.current = defaultVisibility;
    prevSerializedRef.current = serializedDefault;
  }
  
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(defaultVisibilityRef.current);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`table-columns-${tableId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setColumnVisibility({ ...defaultVisibilityRef.current, ...parsed });
      }
    } catch (error) {
      console.warn('Failed to load column preferences from localStorage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, [tableId]); // Remove defaultVisibility from deps

  // Save preferences to localStorage whenever they change
  const updateColumnVisibility = useCallback((updater: VisibilityState | ((prev: VisibilityState) => VisibilityState)) => {
    setColumnVisibility((prev) => {
      const newState = typeof updater === 'function' ? updater(prev) : updater;
      
      try {
        // Only save non-default values to keep localStorage clean
        const toSave = Object.entries(newState).reduce((acc, [key, value]) => {
          if (defaultVisibilityRef.current[key] !== value) {
            acc[key] = value;
          }
          return acc;
        }, {} as VisibilityState);
        
        localStorage.setItem(`table-columns-${tableId}`, JSON.stringify(toSave));
      } catch (error) {
        console.warn('Failed to save column preferences to localStorage:', error);
      }
      
      return newState;
    });
  }, [tableId]);

  // Reset to default preferences
  const resetColumnPreferences = useCallback(() => {
    try {
      localStorage.removeItem(`table-columns-${tableId}`);
      setColumnVisibility(defaultVisibilityRef.current);
    } catch (error) {
      console.warn('Failed to reset column preferences:', error);
    }
  }, [tableId]);

  return {
    columnVisibility,
    setColumnVisibility: updateColumnVisibility,
    resetColumnPreferences,
    isLoaded,
  };
} 