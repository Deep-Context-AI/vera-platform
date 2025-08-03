import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ProviderProfileResponse,
  VerificationStepsResponse,
  StepDetailsResponse,
  ActivityResponse,
  DocumentsResponse,
  VerificationStepsRegistryResponse,
  GetDocumentsParams,
  APIError,
  SyncVerificationRequest,
  SyncVerificationResponse
} from './types';

class ProviderAPIClient {
  private api: AxiosInstance;

  constructor(baseURL: string = 'https://mikhailocampo--vera-platform-v2-fastapi-app-dev.modal.run') {
    this.api = axios.create({
      baseURL: `${baseURL}/v1/vera`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000, // 30 second timeout
    });

    // Add request interceptor for logging (development only)
    this.api.interceptors.request.use(
      (config) => {
        if (import.meta.env?.DEV) {
          console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => {
        if (import.meta.env?.DEV) {
          console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        }
        return response;
      },
      (error) => {
        if (import.meta.env?.DEV) {
          console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
        }
        
        // Transform error to our standard format
        if (error.response?.data?.detail) {
          const apiError: APIError = { detail: error.response.data.detail };
          return Promise.reject(apiError);
        }
        
        // Generic error
        return Promise.reject(new Error('An unexpected error occurred'));
      }
    );
  }

  /**
   * Get available verification steps from registry
   */
  async getAvailableSteps(): Promise<VerificationStepsRegistryResponse> {
    const response: AxiosResponse<VerificationStepsRegistryResponse> = await this.api.get('/verification_steps');
    return response.data;
  }

  /**
   * Get complete provider profile with application data and verification progress
   */
  async getProviderProfile(applicationId: number): Promise<ProviderProfileResponse> {
    const response: AxiosResponse<ProviderProfileResponse> = await this.api.get(`/providers/${applicationId}`);
    return response.data;
  }

  /**
   * Get summary of all verification steps with status and basic info
   */
  async getVerificationSteps(applicationId: number): Promise<VerificationStepsResponse> {
    const response: AxiosResponse<VerificationStepsResponse> = await this.api.get(`/providers/${applicationId}/verification-steps`);
    return response.data;
  }

  /**
   * Get detailed information for a specific verification step
   */
  async getStepDetails(applicationId: number, stepKey: string): Promise<StepDetailsResponse> {
    const response: AxiosResponse<StepDetailsResponse> = await this.api.get(`/providers/${applicationId}/verification-steps/${stepKey}`);
    return response.data;
  }

  /**
   * Get complete activity timeline for a provider
   */
  async getProviderActivity(applicationId: number): Promise<ActivityResponse> {
    const response: AxiosResponse<ActivityResponse> = await this.api.get(`/providers/${applicationId}/activity`);
    return response.data;
  }

  /**
   * Get all documents for a provider, optionally filtered by step
   */
  async getProviderDocuments(applicationId: number, params?: GetDocumentsParams): Promise<DocumentsResponse> {
    const response: AxiosResponse<DocumentsResponse> = await this.api.get(`/providers/${applicationId}/documents`, {
      params
    });
    return response.data;
  }

  /**
   * Get documents for a specific verification step
   */
  async getStepDocuments(applicationId: number, stepKey: string): Promise<DocumentsResponse> {
    return this.getProviderDocuments(applicationId, { step_key: stepKey });
  }

  /**
   * Run a single verification step synchronously and return results
   */
  async runVerificationStepSync(request: SyncVerificationRequest): Promise<SyncVerificationResponse> {
    const requestPayload = {
      ...request,
      requester: request.requester || "annie.nguyen1128@gmail.com"
    };
    
    const response: AxiosResponse<SyncVerificationResponse> = await this.api.post('/verify_step_sync', requestPayload);
    return response.data;
  }

  /**
   * Test the API health endpoint
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await this.api.get('/health');
    return response.data;
  }
}

// Create a singleton instance
const providerAPI = new ProviderAPIClient();

// Export both the class and the singleton
export { ProviderAPIClient };
export default providerAPI;

// Convenience functions for direct use
export const getProviderProfile = (applicationId: number) => providerAPI.getProviderProfile(applicationId);
export const getVerificationSteps = (applicationId: number) => providerAPI.getVerificationSteps(applicationId);
export const getStepDetails = (applicationId: number, stepKey: string) => providerAPI.getStepDetails(applicationId, stepKey);
export const getProviderActivity = (applicationId: number) => providerAPI.getProviderActivity(applicationId);
export const getProviderDocuments = (applicationId: number, params?: GetDocumentsParams) => providerAPI.getProviderDocuments(applicationId, params);
export const getAvailableSteps = () => providerAPI.getAvailableSteps();
export const runVerificationStepSync = (request: SyncVerificationRequest) => providerAPI.runVerificationStepSync(request);
export const healthCheck = () => providerAPI.healthCheck(); 