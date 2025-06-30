// Verification API Client - Centralized helpers for all verification endpoints
// Backend URL: https://mikhailocampo--vera-platform-fastapi-app-dev.modal.run/

// Environment-based API endpoints configuration
const API_ENDPOINTS = {
  DEV: 'https://mikhailocampo--vera-platform-fastapi-app.modal.run',
  PROD: 'https://mikhailocampo--vera-platform-fastapi-app.modal.run',
  get CURRENT() {
    // Check if we're in development environment
    const isDev = process.env.NODE_ENV === 'development' || 
                  typeof window !== 'undefined' && window.location.hostname === 'localhost';
    return isDev ? this.DEV : this.PROD;
  }
};

// Base response interface
interface BaseResponse {
  status: string;
  message: string;
}

// Request interfaces based on the Python models
export interface NPIRequest {
  npi?: string;
  first_name?: string;
  last_name?: string;
  organization_name?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

export interface DEAVerificationRequest {
  first_name: string;
  last_name: string;
  dea_number: string;
}

export interface ABMSRequest {
  first_name: string;
  last_name: string;
  middle_name?: string;
  state: string;
  npi_number: string;
  active_state_medical_license?: string;
  specialty?: string;
}

export interface NPDBAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
}

export interface NPDBRequest {
  first_name: string;
  last_name: string;
  date_of_birth: string; // YYYY-MM-DD
  ssn_last4: string;
  address: NPDBAddress;
  npi_number: string;
  license_number: string;
  state_of_license: string;
  upin?: string;
  dea_number?: string;
  organization_name?: string;
}

export interface ComprehensiveSANCTIONRequest {
  first_name: string;
  last_name: string;
  date_of_birth: string; // YYYY-MM-DD
  npi: string;
  license_number: string;
  license_state: string;
  ssn_last4: string;
}

export interface LADMFRequest {
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string; // YYYY-MM-DD
  social_security_number: string; // 9 digits
}

export interface MedicalRequest {
  npi: string;
  first_name: string;
  last_name: string;
  license_type?: string;
  taxonomy_code?: string;
  provider_type?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface DCARequest {
  first_name: string;
  last_name: string;
  license_number: string;
}

export interface MedicareRequest {
  provider_verification_type: string;
  npi: string;
  first_name: string;
  last_name: string;
  specialty?: string;
  verification_sources: string[];
}

export interface EducationRequest {
  first_name: string;
  last_name: string;
  institution: string;
  degree_type: string;
  graduation_year: number;
  verification_type: string;
}

export interface HospitalPrivilegesRequest {
  first_name: string;
  last_name: string;
  npi_number: string;
  hospital_name: string;
  specialty: string;
  verification_type: string;
}

// Response interfaces (simplified - actual responses will have more fields)
export interface NPIResponse extends BaseResponse {
  data?: any;
}

export interface NewDEAVerificationResponse extends BaseResponse {
  data?: any;
}

export interface ABMSResponse extends BaseResponse {
  data?: any;
}

export interface NPDBResponse extends BaseResponse {
  data?: any;
}

export interface ComprehensiveSANCTIONResponse extends BaseResponse {
  data?: any;
}

export interface LADMFResponse extends BaseResponse {
  data?: any;
}

export interface MedicalResponse extends BaseResponse {
  data?: any;
}

export interface DCAResponse extends BaseResponse {
  data?: any;
}

export interface MedicareResponse extends BaseResponse {
  data?: any;
}

export interface EducationResponse extends BaseResponse {
  data?: any;
}

export interface HospitalPrivilegesResponse extends BaseResponse {
  data?: any;
}

// Generic API call helper
async function apiCall<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  data?: any
): Promise<T> {
  const url = `${API_ENDPOINTS.CURRENT}${endpoint}`;
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data && method === 'POST') {
    config.body = JSON.stringify(data);
  }

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔧 Verification API Call: ${method} ${url}`, data);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Verification API Error: ${response.status} ${response.statusText}`, errorText);
    throw new Error(`API call failed: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ Verification API Response:`, result);
  }

  return result;
}

// Verification API Class
export class VerificationAPI {
  /**
   * NPI (National Provider Identifier) Search
   */
  static async searchNPI(request: NPIRequest): Promise<NPIResponse> {
    // Validate at least one search criterion
    if (!request.npi && !request.first_name && !request.last_name && !request.organization_name) {
      throw new Error('At least one search criterion must be provided: npi, first_name/last_name, or organization_name');
    }

    // Validate NPI format if provided
    if (request.npi && (request.npi.length !== 10 || !/^\d+$/.test(request.npi))) {
      throw new Error('NPI must be exactly 10 digits');
    }

    // Validate state format if provided
    if (request.state && request.state.length !== 2) {
      throw new Error('State must be 2-letter abbreviation');
    }

    return apiCall<NPIResponse>('/v1/npi/search', 'POST', {
      ...request,
      state: request.state?.toUpperCase()
    });
  }

  /**
   * DEA Verification
   */
  static async verifyDEA(request: DEAVerificationRequest): Promise<NewDEAVerificationResponse> {
    // Validate DEA number format
    if (request.dea_number.length !== 9 || 
        !/^[A-Z]{2}\d{7}$/.test(request.dea_number.toUpperCase())) {
      throw new Error('DEA number must be 2 letters followed by 7 digits');
    }

    return apiCall<NewDEAVerificationResponse>('/v1/dea/verify', 'POST', {
      ...request,
      dea_number: request.dea_number.toUpperCase()
    });
  }

  /**
   * ABMS (American Board of Medical Specialties) Certification Lookup
   */
  static async lookupABMSCertification(request: ABMSRequest): Promise<ABMSResponse> {
    // Validate NPI number
    if (request.npi_number.length !== 10 || !/^\d+$/.test(request.npi_number)) {
      throw new Error('NPI number must be exactly 10 digits');
    }

    // Validate state format
    if (request.state.length !== 2) {
      throw new Error('State must be 2-letter abbreviation');
    }

    return apiCall<ABMSResponse>('/v1/abms/certification', 'POST', {
      ...request,
      state: request.state.toUpperCase()
    });
  }

  /**
   * NPDB (National Practitioner Data Bank) Verification
   */
  static async verifyNPDB(request: NPDBRequest): Promise<NPDBResponse> {
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(request.date_of_birth)) {
      throw new Error('Date of birth must be in YYYY-MM-DD format');
    }

    // Validate SSN last 4
    if (request.ssn_last4.length !== 4 || !/^\d{4}$/.test(request.ssn_last4)) {
      throw new Error('SSN last 4 digits must be exactly 4 digits');
    }

    // Validate NPI
    if (request.npi_number.length !== 10 || !/^\d{10}$/.test(request.npi_number)) {
      throw new Error('NPI number must be exactly 10 digits');
    }

    // Validate DEA number if provided
    if (request.dea_number && 
        (request.dea_number.length !== 9 || !/^[A-Z]{2}\d{7}$/.test(request.dea_number.toUpperCase()))) {
      throw new Error('DEA number must be 2 letters followed by 7 digits');
    }

    return apiCall<NPDBResponse>('/v1/npdb/verify', 'POST', {
      ...request,
      address: {
        ...request.address,
        state: request.address.state.toUpperCase()
      },
      state_of_license: request.state_of_license.toUpperCase(),
      dea_number: request.dea_number?.toUpperCase()
    });
  }

  /**
   * Comprehensive Sanctions Check
   */
  static async comprehensiveSanctionsCheck(request: ComprehensiveSANCTIONRequest): Promise<ComprehensiveSANCTIONResponse> {
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(request.date_of_birth)) {
      throw new Error('Date of birth must be in YYYY-MM-DD format');
    }

    // Validate NPI
    if (request.npi.length !== 10 || !/^\d+$/.test(request.npi)) {
      throw new Error('NPI must be exactly 10 digits');
    }

    // Validate SSN last 4
    if (request.ssn_last4.length !== 4 || !/^\d{4}$/.test(request.ssn_last4)) {
      throw new Error('SSN last 4 digits must be exactly 4 digits');
    }

    return apiCall<ComprehensiveSANCTIONResponse>('/v1/sanctioncheck', 'POST', {
      ...request,
      license_state: request.license_state.toUpperCase()
    });
  }

  /**
   * LADMF (Limited Access Death Master File) Verification
   */
  static async verifyLADMF(request: LADMFRequest): Promise<LADMFResponse> {
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(request.date_of_birth)) {
      throw new Error('Date of birth must be in YYYY-MM-DD format');
    }

    // Validate SSN format
    if (request.social_security_number.length !== 9 || !/^\d{9}$/.test(request.social_security_number)) {
      throw new Error('Social Security Number must be exactly 9 digits');
    }

    return apiCall<LADMFResponse>('/v1/ladmf/verify', 'POST', request);
  }

  /**
   * Medical (Medi-Cal Managed Care + ORP) Verification
   */
  static async verifyMedical(request: MedicalRequest): Promise<MedicalResponse> {
    // Validate NPI
    if (request.npi.length !== 10 || !/^\d+$/.test(request.npi)) {
      throw new Error('NPI must be exactly 10 digits');
    }

    return apiCall<MedicalResponse>('/v1/medical/verify', 'POST', {
      ...request,
      state: request.state?.toUpperCase()
    });
  }

  /**
   * DCA (Department of Consumer Affairs) CA License Verification
   */
  static async verifyDCALicense(request: DCARequest): Promise<DCAResponse> {
    return apiCall<DCAResponse>('/v1/dca/verify', 'POST', request);
  }

  /**
   * Medicare Enrollment Verification
   */
  static async verifyMedicare(request: MedicareRequest): Promise<MedicareResponse> {
    // Validate NPI
    if (request.npi.length !== 10 || !/^\d+$/.test(request.npi)) {
      throw new Error('NPI must be exactly 10 digits');
    }

    // Validate provider verification type
    const allowedTypes = ['medicare_enrollment'];
    if (!allowedTypes.includes(request.provider_verification_type)) {
      throw new Error(`provider_verification_type must be one of: ${allowedTypes.join(', ')}`);
    }

    // Validate verification sources
    const allowedSources = ['ffs_provider_enrollment', 'ordering_referring_provider'];
    for (const source of request.verification_sources) {
      if (!allowedSources.includes(source)) {
        throw new Error(`verification_sources must contain only: ${allowedSources.join(', ')}`);
      }
    }

    if (request.verification_sources.length === 0) {
      throw new Error('At least one verification source must be provided');
    }

    return apiCall<MedicareResponse>('/v1/medicare/verify', 'POST', request);
  }

  /**
   * Education Verification with Transcript Generation
   */
  static async verifyEducation(request: EducationRequest): Promise<EducationResponse> {
    // Validate graduation year
    if (request.graduation_year < 1900 || request.graduation_year > 2030) {
      throw new Error('Graduation year must be between 1900 and 2030');
    }

    // Validate verification type
    const allowedTypes = ['transcript_generation', 'degree_verification', 'enrollment_verification'];
    if (!allowedTypes.includes(request.verification_type)) {
      throw new Error(`verification_type must be one of: ${allowedTypes.join(', ')}`);
    }

    // Validate degree type
    const allowedDegrees = [
      'Associate', 'Bachelor\'s', 'Master\'s', 'PhD', 'Doctorate', 'MD', 'JD', 'MBA', 
      'MS', 'MA', 'BS', 'BA', 'Certificate', 'Diploma'
    ];
    if (!allowedDegrees.some(degree => degree.toLowerCase() === request.degree_type.toLowerCase())) {
      throw new Error(`degree_type must be one of: ${allowedDegrees.join(', ')}`);
    }

    return apiCall<EducationResponse>('/v1/education/verify', 'POST', request);
  }

  /**
   * Hospital Privileges Verification with Transcript Generation
   */
  static async verifyHospitalPrivileges(request: HospitalPrivilegesRequest): Promise<HospitalPrivilegesResponse> {
    // Validate NPI number
    if (request.npi_number.length !== 10 || !/^\d+$/.test(request.npi_number)) {
      throw new Error('NPI number must be exactly 10 digits');
    }

    // Validate verification type
    const allowedTypes = ['current_privileges', 'historical_privileges', 'privileges_status', 'general_inquiry'];
    if (!allowedTypes.includes(request.verification_type.toLowerCase())) {
      throw new Error(`Verification type must be one of: ${allowedTypes.join(', ')}`);
    }

    return apiCall<HospitalPrivilegesResponse>('/v1/hospital-privileges/verify', 'POST', {
      ...request,
      verification_type: request.verification_type.toLowerCase(),
      specialty: request.specialty.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ') // Title case
    });
  }
}

// Convenience helper functions for common use cases
export const verificationHelpers = {
  /**
   * Quick NPI lookup by number only
   */
  async quickNPILookup(npi: string): Promise<NPIResponse> {
    return VerificationAPI.searchNPI({ npi });
  },

  /**
   * Quick provider search by name
   */
  async searchProviderByName(firstName: string, lastName: string, state?: string): Promise<NPIResponse> {
    return VerificationAPI.searchNPI({ 
      first_name: firstName, 
      last_name: lastName,
      state: state?.toUpperCase()
    });
  },

  /**
   * Standard Medicare enrollment check
   */
  async standardMedicareCheck(npi: string, firstName: string, lastName: string): Promise<MedicareResponse> {
    return VerificationAPI.verifyMedicare({
      provider_verification_type: 'medicare_enrollment',
      npi,
      first_name: firstName,
      last_name: lastName,
      verification_sources: ['ffs_provider_enrollment', 'ordering_referring_provider']
    });
  },

  /**
   * Basic sanctions check
   */
  async basicSanctionsCheck(
    firstName: string,
    lastName: string,
    dateOfBirth: string,
    npi: string,
    licenseNumber: string,
    licenseState: string,
    ssnLast4: string
  ): Promise<ComprehensiveSANCTIONResponse> {
    return VerificationAPI.comprehensiveSanctionsCheck({
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      npi,
      license_number: licenseNumber,
      license_state: licenseState,
      ssn_last4: ssnLast4
    });
  },

  /**
   * Standard education verification
   */
  async standardEducationVerification(
    firstName: string,
    lastName: string,
    institution: string,
    degreeType: string,
    graduationYear: number
  ): Promise<EducationResponse> {
    return VerificationAPI.verifyEducation({
      first_name: firstName,
      last_name: lastName,
      institution,
      degree_type: degreeType,
      graduation_year: graduationYear,
      verification_type: 'degree_verification'
    });
  }
};

// Export API endpoints for debugging
export { API_ENDPOINTS }; 