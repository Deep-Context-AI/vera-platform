import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { ApplicationsAPI } from '@/lib/api';
import type { 
  Application, 
  ApplicationStatus, 
  CreateApplicationRequest, 
  UpdateApplicationRequest 
} from '@/types/applications';

export interface ApplicationsState {
  // Data
  applications: Application[];
  selectedApplication: Application | null;
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // Filters & Search
  filters: {
    status?: ApplicationStatus;
    provider_id?: number;
    search: string;
  };
  
  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  
  // Actions
  fetchApplications: () => Promise<void>;
  fetchApplication: (id: number) => Promise<void>;
  createApplication: (data: CreateApplicationRequest) => Promise<Application | null>;
  updateApplication: (data: UpdateApplicationRequest) => Promise<Application | null>;
  deleteApplication: (id: number) => Promise<boolean>;
  updateApplicationStatus: (id: number, status: ApplicationStatus) => Promise<Application | null>;
  
  // Filter & Search Actions
  setFilters: (filters: Partial<ApplicationsState['filters']>) => void;
  clearFilters: () => void;
  searchApplications: (searchTerm: string) => Promise<void>;
  
  // Pagination Actions
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  loadMore: () => Promise<void>;
  
  // UI Actions
  setSelectedApplication: (application: Application | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  applications: [],
  selectedApplication: null,
  loading: false,
  error: null,
  filters: {
    search: '',
  },
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    hasMore: true,
  },
};

export const useApplicationsStore = create<ApplicationsState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Fetch applications with current filters and pagination
        fetchApplications: async () => {
          const { filters, pagination } = get();
          set({ loading: true, error: null });
          
          try {
            const { data, error } = await ApplicationsAPI.getApplications({
              status: filters.status,
              provider_id: filters.provider_id,
              limit: pagination.limit,
              offset: (pagination.page - 1) * pagination.limit,
            });

            if (error) {
              set({ error: error.message || 'Failed to fetch applications', loading: false });
              return;
            }

            set({
              applications: data || [],
              pagination: {
                ...pagination,
                total: data?.length || 0,
                hasMore: (data?.length || 0) === pagination.limit,
              },
              loading: false,
            });
          } catch (err) {
            set({ 
              error: err instanceof Error ? err.message : 'An unexpected error occurred',
              loading: false 
            });
          }
        },

        // Fetch single application
        fetchApplication: async (id: number) => {
          set({ loading: true, error: null });
          
          try {
            const { data, error } = await ApplicationsAPI.getApplication(id);

            if (error) {
              set({ error: error.message || 'Failed to fetch application', loading: false });
              return;
            }

            set({ selectedApplication: data, loading: false });
          } catch (err) {
            set({ 
              error: err instanceof Error ? err.message : 'An unexpected error occurred',
              loading: false 
            });
          }
        },

        // Create new application
        createApplication: async (data: CreateApplicationRequest) => {
          set({ error: null });
          
          try {
            const { data: newApplication, error } = await ApplicationsAPI.createApplication(data);

            if (error) {
              set({ error: error.message || 'Failed to create application' });
              return null;
            }

            if (newApplication) {
              set((state) => ({
                applications: [newApplication, ...state.applications],
                pagination: {
                  ...state.pagination,
                  total: state.pagination.total + 1,
                },
              }));
            }

            return newApplication;
          } catch (err) {
            set({ error: err instanceof Error ? err.message : 'An unexpected error occurred' });
            return null;
          }
        },

        // Update application
        updateApplication: async (data: UpdateApplicationRequest) => {
          set({ error: null });
          
          try {
            const { data: updatedApplication, error } = await ApplicationsAPI.updateApplication(data);

            if (error) {
              set({ error: error.message || 'Failed to update application' });
              return null;
            }

            if (updatedApplication) {
              set((state) => ({
                applications: state.applications.map(app => 
                  app.id === updatedApplication.id ? updatedApplication : app
                ),
                selectedApplication: state.selectedApplication?.id === updatedApplication.id 
                  ? updatedApplication 
                  : state.selectedApplication,
              }));
            }

            return updatedApplication;
          } catch (err) {
            set({ error: err instanceof Error ? err.message : 'An unexpected error occurred' });
            return null;
          }
        },

        // Delete application
        deleteApplication: async (id: number) => {
          set({ error: null });
          
          try {
            const { error } = await ApplicationsAPI.deleteApplication(id);

            if (error) {
              set({ error: error.message || 'Failed to delete application' });
              return false;
            }

            set((state) => ({
              applications: state.applications.filter(app => app.id !== id),
              selectedApplication: state.selectedApplication?.id === id ? null : state.selectedApplication,
              pagination: {
                ...state.pagination,
                total: state.pagination.total - 1,
              },
            }));

            return true;
          } catch (err) {
            set({ error: err instanceof Error ? err.message : 'An unexpected error occurred' });
            return false;
          }
        },

        // Update application status
        updateApplicationStatus: async (id: number, status: ApplicationStatus) => {
          set({ error: null });
          
          try {
            const { data: updatedApplication, error } = await ApplicationsAPI.updateApplicationStatus(id, status);

            if (error) {
              set({ error: error.message || 'Failed to update application status' });
              return null;
            }

            if (updatedApplication) {
              set((state) => ({
                applications: state.applications.map(app => 
                  app.id === updatedApplication.id ? updatedApplication : app
                ),
                selectedApplication: state.selectedApplication?.id === updatedApplication.id 
                  ? updatedApplication 
                  : state.selectedApplication,
              }));
            }

            return updatedApplication;
          } catch (err) {
            set({ error: err instanceof Error ? err.message : 'An unexpected error occurred' });
            return null;
          }
        },

        // Set filters
        setFilters: (newFilters) => {
          set((state) => ({
            filters: { ...state.filters, ...newFilters },
            pagination: { ...state.pagination, page: 1 }, // Reset pagination when filters change
          }));
          
          // Auto-fetch with new filters
          get().fetchApplications();
        },

        // Clear filters
        clearFilters: () => {
          set((state) => ({
            filters: { search: '' },
            pagination: { ...state.pagination, page: 1 },
          }));
          
          get().fetchApplications();
        },

        // Search applications
        searchApplications: async (searchTerm: string) => {
          set({ loading: true, error: null });
          
          try {
            if (!searchTerm.trim()) {
              await get().fetchApplications();
              return;
            }

            const { data, error } = await ApplicationsAPI.searchApplications(searchTerm);

            if (error) {
              set({ error: error.message || 'Failed to search applications', loading: false });
              return;
            }

            set({
              applications: data || [],
              pagination: {
                ...get().pagination,
                total: data?.length || 0,
                page: 1,
                hasMore: false, // Search results don't support pagination
              },
              filters: {
                ...get().filters,
                search: searchTerm,
              },
              loading: false,
            });
          } catch (err) {
            set({ 
              error: err instanceof Error ? err.message : 'An unexpected error occurred',
              loading: false 
            });
          }
        },

        // Pagination actions
        setPage: (page: number) => {
          set((state) => ({
            pagination: { ...state.pagination, page },
          }));
          
          get().fetchApplications();
        },

        setLimit: (limit: number) => {
          set((state) => ({
            pagination: { ...state.pagination, limit, page: 1 },
          }));
          
          get().fetchApplications();
        },

        loadMore: async () => {
          const { pagination } = get();
          if (!pagination.hasMore) return;
          
          set((state) => ({
            pagination: { ...state.pagination, page: state.pagination.page + 1 },
          }));
          
          const { filters, pagination: newPagination } = get();
          set({ loading: true });
          
          try {
            const { data, error } = await ApplicationsAPI.getApplications({
              status: filters.status,
              provider_id: filters.provider_id,
              limit: newPagination.limit,
              offset: (newPagination.page - 1) * newPagination.limit,
            });

            if (error) {
              set({ error: error.message || 'Failed to load more applications', loading: false });
              return;
            }

            set((state) => ({
              applications: [...state.applications, ...(data || [])],
              pagination: {
                ...state.pagination,
                hasMore: (data?.length || 0) === newPagination.limit,
              },
              loading: false,
            }));
          } catch (err) {
            set({ 
              error: err instanceof Error ? err.message : 'An unexpected error occurred',
              loading: false 
            });
          }
        },

        // UI actions
        setSelectedApplication: (application: Application | null) => {
          set({ selectedApplication: application });
        },

        clearError: () => {
          set({ error: null });
        },

        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'applications-store',
        storage: createJSONStorage(() => sessionStorage),
        // Only persist filters and pagination, not the actual data
        partialize: (state) => ({
          filters: state.filters,
          pagination: state.pagination,
        }),
      }
    ),
    {
      name: 'applications-store',
    }
  )
); 