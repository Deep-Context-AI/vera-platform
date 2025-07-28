import { create } from 'zustand';
import { 
  ProviderProfileResponse, 
  VerificationStepsResponse, 
  DocumentsResponse, 
  ActivityResponse,
} from '../lib/types';
import {
  getProviderProfile,
  getVerificationSteps,
  getProviderDocuments,
  getProviderActivity
} from '../lib/providerApi';

interface ProviderState {
  // Data
  profileData: ProviderProfileResponse | null;
  stepsData: VerificationStepsResponse | null;
  documentsData: DocumentsResponse | null;
  activityData: ActivityResponse | null;
  
  // Loading states
  profileLoading: boolean;
  stepsLoading: boolean;
  documentsLoading: boolean;
  activityLoading: boolean;
  
  // Error states
  profileError: string | null;
  stepsError: string | null;
  documentsError: string | null;
  activityError: string | null;
  
  // Current application ID
  currentApplicationId: number | null;
  
  // Actions
  fetchProviderProfile: (applicationId: number) => Promise<void>;
  fetchVerificationSteps: (applicationId: number) => Promise<void>;
  fetchDocuments: (applicationId: number) => Promise<void>;
  fetchActivity: (applicationId: number) => Promise<void>;
  clearData: () => void;
  setCurrentApplicationId: (id: number) => void;
}

export const useProviderStore = create<ProviderState>((set) => ({
  // Initial state
  profileData: null,
  stepsData: null,
  documentsData: null,
  activityData: null,
  
  profileLoading: false,
  stepsLoading: false,
  documentsLoading: false,
  activityLoading: false,
  
  profileError: null,
  stepsError: null,
  documentsError: null,
  activityError: null,
  
  currentApplicationId: null,
  
  // Actions
  fetchProviderProfile: async (applicationId: number) => {
    set({ profileLoading: true, profileError: null });
    try {
      const data = await getProviderProfile(applicationId);
      set({ 
        profileData: data, 
        profileLoading: false,
        currentApplicationId: applicationId 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch provider profile';
      set({ 
        profileError: errorMessage, 
        profileLoading: false 
      });
    }
  },

  fetchVerificationSteps: async (applicationId: number) => {
    set({ stepsLoading: true, stepsError: null });
    try {
      const data = await getVerificationSteps(applicationId);
      set({ stepsData: data, stepsLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch verification steps';
      set({ 
        stepsError: errorMessage, 
        stepsLoading: false 
      });
    }
  },

  fetchDocuments: async (applicationId: number) => {
    set({ documentsLoading: true, documentsError: null });
    try {
      const data = await getProviderDocuments(applicationId);
      set({ documentsData: data, documentsLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch documents';
      set({ 
        documentsError: errorMessage, 
        documentsLoading: false 
      });
    }
  },

  fetchActivity: async (applicationId: number) => {
    set({ activityLoading: true, activityError: null });
    try {
      const data = await getProviderActivity(applicationId);
      set({ activityData: data, activityLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch activity';
      set({ 
        activityError: errorMessage, 
        activityLoading: false 
      });
    }
  },

  clearData: () => {
    set({
      profileData: null,
      stepsData: null,
      documentsData: null,
      activityData: null,
      profileError: null,
      stepsError: null,
      documentsError: null,
      activityError: null,
      currentApplicationId: null
    });
  },

  setCurrentApplicationId: (id: number) => {
    set({ currentApplicationId: id });
  }
}));

// Convenience hooks for specific data
export const useProviderProfile = () => {
  const { profileData, profileLoading, profileError, fetchProviderProfile } = useProviderStore();
  return { profileData, profileLoading, profileError, fetchProviderProfile };
};

export const useProviderDocuments = () => {
  const { documentsData, documentsLoading, documentsError, fetchDocuments } = useProviderStore();
  return { documentsData, documentsLoading, documentsError, fetchDocuments };
};

export const useProviderActivity = () => {
  const { activityData, activityLoading, activityError, fetchActivity } = useProviderStore();
  return { activityData, activityLoading, activityError, fetchActivity };
}; 