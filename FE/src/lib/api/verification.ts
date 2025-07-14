// Verification API Client - Centralized helpers for all verification endpoints
// Backend URL: https://mikhailocampo--vera-platform-fastapi-app-dev.modal.run/

// Environment-based API endpoints configuration
const API_ENDPOINTS = {
  DEV: 'https://mikhailocampo--vera-platform-v2-fastapi-app-dev.modal.run',
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

// Request interfaces based on the Python models - EXACTLY matching backend
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
  document_url?: string; 
}

export interface NewDEAVerificationResponse extends BaseResponse {
  data?: any;
  document_url?: string; 
}

export interface ABMSResponse extends BaseResponse {
  data?: any;
  document_url?: string; 
}

export interface NPDBResponse extends BaseResponse {
  data?: any;
  document_url?: string; 
}

export interface ComprehensiveSANCTIONResponse extends BaseResponse {
  data?: any;
  document_url?: string; 
}

export interface LADMFResponse extends BaseResponse {
  data?: any;
  document_url?: string; 
}

export interface MedicalResponse extends BaseResponse {
  data?: any;
  document_url?: string; 
}

export interface DCAResponse extends BaseResponse {
  data?: any;
  document_url?: string; 
}

export interface MedicareResponse extends BaseResponse {
  data?: any;
  document_url?: string; 
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
  data?: any,
  additionalHeaders?: Record<string, string>,
  queryParams?: Record<string, string>
): Promise<T> {
  let url = `${API_ENDPOINTS.CURRENT}${endpoint}`;
  
  // Add query parameters if provided
  if (queryParams && Object.keys(queryParams).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`;
    }
  }
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...additionalHeaders,
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
  static async searchNPI(request: NPIRequest, headers?: Record<string, string>, generatePdf?: boolean): Promise<NPIResponse> {
    // Validate at least one search criterion
    if (!request.npi && !request.first_name && !request.last_name && !request.organization_name) {
      throw new Error('At least one search criterion must be provided: npi, first_name/last_name, or organization_name');
    }

    // Validate NPI format if provided
    if (request.npi && (request.npi.length !== 10 || !/^\d+$/.test(request.npi))) {
      throw new Error('NPI must be exactly 10 digits');
    }

    // Clean the request object to match backend exactly
    const cleanRequest: NPIRequest = {
      ...request
    };

    // Normalize state to uppercase 2-letter format (backend expects this)
    if (cleanRequest.state) {
      if (cleanRequest.state.length > 2) {
        // Convert full state name to abbreviation
        const stateAbbreviations: Record<string, string> = {
          'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
          'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
          'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
          'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
          'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
          'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
          'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
          'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
          'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
          'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
        };
        
        const stateKey = cleanRequest.state.toLowerCase();
        if (stateAbbreviations[stateKey]) {
          cleanRequest.state = stateAbbreviations[stateKey];
        } else {
          throw new Error('Invalid state name or abbreviation');
        }
      } else if (cleanRequest.state.length === 2) {
        cleanRequest.state = cleanRequest.state.toUpperCase();
      } else {
        throw new Error('State must be 2-letter abbreviation or full state name');
      }
    }

    // Prepare query parameters
    const queryParams: Record<string, string> = {};
    if (generatePdf) {
      queryParams.generate_pdf = 'true';
    }

    return apiCall<NPIResponse>('/v1/npi/search', 'POST', cleanRequest, headers, queryParams);
  }

  /**
   * DEA Verification
   */
  static async verifyDEA(request: DEAVerificationRequest, headers?: Record<string, string>, generatePdf?: boolean): Promise<NewDEAVerificationResponse> {
    // Validate DEA number format
    if (request.dea_number.length !== 9 || 
        !/^[A-Z]{2}\d{7}$/.test(request.dea_number.toUpperCase())) {
      throw new Error('DEA number must be 2 letters followed by 7 digits');
    }

    // Clean the request object to match backend exactly
    const cleanRequest: DEAVerificationRequest = {
      first_name: request.first_name,
      last_name: request.last_name,
      dea_number: request.dea_number.toUpperCase()
    };

    // Prepare query parameters
    const queryParams: Record<string, string> = {};
    if (generatePdf) {
      queryParams.generate_pdf = 'true';
    }

    return apiCall<NewDEAVerificationResponse>('/v1/dea/verify', 'POST', cleanRequest, headers, queryParams);
  }

  /**
   * ABMS (American Board of Medical Specialties) Certification Lookup
   */
  static async lookupABMSCertification(request: ABMSRequest, headers?: Record<string, string>, generatePdf?: boolean): Promise<ABMSResponse> {
    // Validate NPI number
    if (request.npi_number.length !== 10 || !/^\d+$/.test(request.npi_number)) {
      throw new Error('NPI number must be exactly 10 digits');
    }

    // Validate state format
    if (request.state.length !== 2) {
      throw new Error('State must be 2-letter abbreviation');
    }

    // Clean the request object to match backend exactly
    const cleanRequest: ABMSRequest = {
      first_name: request.first_name,
      last_name: request.last_name,
      state: request.state.toUpperCase(),
      npi_number: request.npi_number,
      ...(request.middle_name && { middle_name: request.middle_name }),
      ...(request.active_state_medical_license && { active_state_medical_license: request.active_state_medical_license }),
      ...(request.specialty && { specialty: request.specialty })
    };

    // Prepare query parameters
    const queryParams: Record<string, string> = {};
    if (generatePdf) {
      queryParams.generate_pdf = 'true';
    }

    return apiCall<ABMSResponse>('/v1/abms/certification', 'POST', cleanRequest, headers, queryParams);
  }

  /**
   * NPDB (National Practitioner Data Bank) Verification
   */
  static async verifyNPDB(request: NPDBRequest, headers?: Record<string, string>, generatePdf?: boolean): Promise<NPDBResponse> {
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

    // Clean the request object to match backend exactly
    const cleanRequest: NPDBRequest = {
      first_name: request.first_name,
      last_name: request.last_name,
      date_of_birth: request.date_of_birth,
      ssn_last4: request.ssn_last4,
      address: {
        line1: request.address.line1,
        city: request.address.city,
        state: request.address.state.toUpperCase(),
        zip: request.address.zip,
        ...(request.address.line2 && { line2: request.address.line2 })
      },
      npi_number: request.npi_number,
      license_number: request.license_number,
      state_of_license: request.state_of_license.toUpperCase(),
      ...(request.upin && { upin: request.upin }),
      ...(request.dea_number && { dea_number: request.dea_number.toUpperCase() }),
      ...(request.organization_name && { organization_name: request.organization_name })
    };

    // Prepare query parameters
    const queryParams: Record<string, string> = {};
    if (generatePdf) {
      queryParams.generate_pdf = 'true';
    }

    return apiCall<NPDBResponse>('/v1/npdb/verify', 'POST', cleanRequest, headers, queryParams);
  }

  /**
   * Comprehensive Sanctions Check
   */
  static async comprehensiveSanctionsCheck(request: ComprehensiveSANCTIONRequest, headers?: Record<string, string>, generatePdf?: boolean): Promise<ComprehensiveSANCTIONResponse> {
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

    // Clean the request object to match backend exactly
    const cleanRequest: ComprehensiveSANCTIONRequest = {
      first_name: request.first_name,
      last_name: request.last_name,
      date_of_birth: request.date_of_birth,
      npi: request.npi,
      license_number: request.license_number,
      license_state: request.license_state.toUpperCase(),
      ssn_last4: request.ssn_last4
    };

    // Prepare query parameters
    const queryParams: Record<string, string> = {};
    if (generatePdf) {
      queryParams.generate_pdf = 'true';
    }

    return apiCall<ComprehensiveSANCTIONResponse>('/v1/sanctioncheck', 'POST', cleanRequest, headers, queryParams);
  }

  /**
   * LADMF (Limited Access Death Master File) Verification
   */
  static async verifyLADMF(request: LADMFRequest, headers?: Record<string, string>, generatePdf?: boolean): Promise<LADMFResponse> {
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(request.date_of_birth)) {
      throw new Error('Date of birth must be in YYYY-MM-DD format');
    }

    // Validate SSN format
    if (request.social_security_number.length !== 9 || !/^\d{9}$/.test(request.social_security_number)) {
      throw new Error('Social Security Number must be exactly 9 digits');
    }

    // Clean the request object to match backend exactly
    const cleanRequest: LADMFRequest = {
      first_name: request.first_name,
      last_name: request.last_name,
      date_of_birth: request.date_of_birth,
      social_security_number: request.social_security_number,
      ...(request.middle_name && { middle_name: request.middle_name })
    };

    // Prepare query parameters
    const queryParams: Record<string, string> = {};
    if (generatePdf) {
      queryParams.generate_pdf = 'true';
    }

    return apiCall<LADMFResponse>('/v1/ladmf/verify', 'POST', cleanRequest, headers, queryParams);
  }

  /**
   * Medical (Medi-Cal Managed Care + ORP) Verification
   */
  static async verifyMedical(request: MedicalRequest, headers?: Record<string, string>, generatePdf?: boolean): Promise<MedicalResponse> {
    // Validate NPI
    if (request.npi.length !== 10 || !/^\d+$/.test(request.npi)) {
      throw new Error('NPI must be exactly 10 digits');
    }

    // Clean the request object to match backend exactly
    const cleanRequest: MedicalRequest = {
      npi: request.npi,
      first_name: request.first_name,
      last_name: request.last_name,
      ...(request.license_type && { license_type: request.license_type }),
      ...(request.taxonomy_code && { taxonomy_code: request.taxonomy_code }),
      ...(request.provider_type && { provider_type: request.provider_type }),
      ...(request.city && { city: request.city }),
      ...(request.state && { state: request.state.toUpperCase() }),
      ...(request.zip && { zip: request.zip })
    };

    // Prepare query parameters
    const queryParams: Record<string, string> = {};
    if (generatePdf) {
      queryParams.generate_pdf = 'true';
    }

    return apiCall<MedicalResponse>('/v1/medical/verify', 'POST', cleanRequest, headers, queryParams);
  }

  /**
   * DCA (Department of Consumer Affairs) CA License Verification
   */
  static async verifyDCALicense(request: DCARequest, headers?: Record<string, string>, generatePdf?: boolean): Promise<DCAResponse> {
    // Clean the request object to match backend exactly
    const cleanRequest: DCARequest = {
      first_name: request.first_name,
      last_name: request.last_name,
      license_number: request.license_number
    };

    // Prepare query parameters
    const queryParams: Record<string, string> = {};
    if (generatePdf) {
      queryParams.generate_pdf = 'true';
    }

    return apiCall<DCAResponse>('/v1/dca/verify', 'POST', cleanRequest, headers, queryParams);
  }

  /**
   * Medicare Enrollment Verification
   */
  static async verifyMedicare(request: MedicareRequest, headers?: Record<string, string>, generatePdf?: boolean): Promise<MedicareResponse> {
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

    // Clean the request object to match backend exactly
    const cleanRequest: MedicareRequest = {
      provider_verification_type: request.provider_verification_type,
      npi: request.npi,
      first_name: request.first_name,
      last_name: request.last_name,
      verification_sources: request.verification_sources,
      ...(request.specialty && { specialty: request.specialty })
    };

    // Prepare query parameters
    const queryParams: Record<string, string> = {};
    if (generatePdf) {
      queryParams.generate_pdf = 'true';
    }

    return apiCall<MedicareResponse>('/v1/medicare/verify', 'POST', cleanRequest, headers, queryParams);
  }

  /**
   * Education Verification with Transcript Generation
   */
  static async verifyEducation(request: EducationRequest, headers?: Record<string, string>, generatePdf?: boolean): Promise<EducationResponse> {
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

    // Clean the request object to match backend exactly
    const cleanRequest: EducationRequest = {
      first_name: request.first_name,
      last_name: request.last_name,
      institution: request.institution,
      degree_type: request.degree_type,
      graduation_year: request.graduation_year,
      verification_type: request.verification_type
    };

    // Prepare query parameters
    const queryParams: Record<string, string> = {};
    if (generatePdf) {
      queryParams.generate_pdf = 'true';
    }

    return apiCall<EducationResponse>('/v1/education/verify', 'POST', cleanRequest, headers, queryParams);
  }

  /**
   * Hospital Privileges Verification with Transcript Generation
   */
  static async verifyHospitalPrivileges(request: HospitalPrivilegesRequest, headers?: Record<string, string>, generatePdf?: boolean): Promise<HospitalPrivilegesResponse> {
    // Validate NPI number
    if (request.npi_number.length !== 10 || !/^\d+$/.test(request.npi_number)) {
      throw new Error('NPI number must be exactly 10 digits');
    }

    // Validate verification type
    const allowedTypes = ['current_privileges', 'historical_privileges', 'privileges_status', 'general_inquiry'];
    if (!allowedTypes.includes(request.verification_type.toLowerCase())) {
      throw new Error(`Verification type must be one of: ${allowedTypes.join(', ')}`);
    }

    // Clean the request object to match backend exactly
    const cleanRequest: HospitalPrivilegesRequest = {
      first_name: request.first_name,
      last_name: request.last_name,
      npi_number: request.npi_number,
      hospital_name: request.hospital_name,
      specialty: request.specialty,
      verification_type: request.verification_type.toLowerCase()
    };

    // Prepare query parameters
    const queryParams: Record<string, string> = {};
    if (generatePdf) {
      queryParams.generate_pdf = 'true';
    }

    return apiCall<HospitalPrivilegesResponse>('/v1/hospital-privileges/verify', 'POST', cleanRequest, headers, queryParams);
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
      ...(state && { state: state.toUpperCase() })
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