'use client';

import { useState, useEffect, useCallback } from 'react';
import { ApplicationsAPI } from '@/lib/api';
import type { 
  Application, 
  ApplicationStatus, 
  CreateApplicationRequest, 
  UpdateApplicationRequest 
} from '@/lib/api';

export interface UseApplicationsOptions {
  status?: ApplicationStatus;
  provider_id?: number;
  limit?: number;
  autoFetch?: boolean;
}

export interface UseApplicationsReturn {
  applications: Application[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  
  // Actions
  fetchApplications: () => Promise<void>;
  createApplication: (data: CreateApplicationRequest) => Promise<Application | null>;
  updateApplication: (data: UpdateApplicationRequest) => Promise<Application | null>;
  deleteApplication: (id: number) => Promise<boolean>;
  updateStatus: (id: number, status: ApplicationStatus) => Promise<Application | null>;
  searchApplications: (searchTerm: string) => Promise<void>;
  
  // Utilities
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useApplications(options: UseApplicationsOptions = {}): UseApplicationsReturn {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const { status, provider_id, limit = 50, autoFetch = true } = options;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: apiError } = await ApplicationsAPI.getApplications({
        status,
        provider_id,
        limit,
      });

      if (apiError) {
        setError(apiError.message || 'Failed to fetch applications');
        return;
      }

      setApplications(data || []);
      setTotalCount(data?.length || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [status, provider_id, limit]);

  const createApplication = useCallback(async (data: CreateApplicationRequest): Promise<Application | null> => {
    setError(null);

    try {
      const { data: newApplication, error: apiError } = await ApplicationsAPI.createApplication(data);

      if (apiError) {
        setError(apiError.message || 'Failed to create application');
        return null;
      }

      if (newApplication) {
        setApplications(prev => [newApplication, ...prev]);
        setTotalCount(prev => prev + 1);
      }

      return newApplication;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return null;
    }
  }, []);

  const updateApplication = useCallback(async (data: UpdateApplicationRequest): Promise<Application | null> => {
    setError(null);

    try {
      const { data: updatedApplication, error: apiError } = await ApplicationsAPI.updateApplication(data);

      if (apiError) {
        setError(apiError.message || 'Failed to update application');
        return null;
      }

      if (updatedApplication) {
        setApplications(prev => 
          prev.map(app => app.id === updatedApplication.id ? updatedApplication : app)
        );
      }

      return updatedApplication;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return null;
    }
  }, []);

  const deleteApplication = useCallback(async (id: number): Promise<boolean> => {
    setError(null);

    try {
      const { error: apiError } = await ApplicationsAPI.deleteApplication(id);

      if (apiError) {
        setError(apiError.message || 'Failed to delete application');
        return false;
      }

      setApplications(prev => prev.filter(app => app.id !== id));
      setTotalCount(prev => prev - 1);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return false;
    }
  }, []);

  const updateStatus = useCallback(async (id: number, status: ApplicationStatus): Promise<Application | null> => {
    setError(null);

    try {
      const { data: updatedApplication, error: apiError } = await ApplicationsAPI.updateApplicationStatus(id, status);

      if (apiError) {
        setError(apiError.message || 'Failed to update application status');
        return null;
      }

      if (updatedApplication) {
        setApplications(prev => 
          prev.map(app => app.id === updatedApplication.id ? updatedApplication : app)
        );
      }

      return updatedApplication;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return null;
    }
  }, []);

  const searchApplications = useCallback(async (searchTerm: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: apiError } = await ApplicationsAPI.searchApplications(searchTerm);

      if (apiError) {
        setError(apiError.message || 'Failed to search applications');
        return;
      }

      setApplications(data || []);
      setTotalCount(data?.length || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchApplications();
  }, [fetchApplications]);

  // Auto-fetch on mount and option changes
  useEffect(() => {
    if (autoFetch) {
      fetchApplications();
    }
  }, [fetchApplications, autoFetch]);

  return {
    applications,
    loading,
    error,
    totalCount,
    fetchApplications,
    createApplication,
    updateApplication,
    deleteApplication,
    updateStatus,
    searchApplications,
    refresh,
    clearError,
  };
}

// Additional hook for single application
export function useApplication(id: number) {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApplication = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: apiError } = await ApplicationsAPI.getApplication(id);

      if (apiError) {
        setError(apiError.message || 'Failed to fetch application');
        return;
      }

      setApplication(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  return {
    application,
    loading,
    error,
    refetch: fetchApplication,
  };
} 