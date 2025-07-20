/**
 * Maps practitioner data to the specific request format required by each verification step
 */

export interface PractitionerContext {
  first_name: string;
  last_name: string;
  middle_name?: string;
  full_name: string;
  npi: string;
  npi_number: string;
  dea_number: string;
  license_number: string;
  date_of_birth: string;
  ssn_last4: string;
  social_security_number: string;
  gender: string;
  address?: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
  };
  city: string;
  state: string;
  zip: string;
  postal_code: string;
  state_of_license: string;
  license_state: string;
  institution: string;
  degree_type: string;
  graduation_year: number;
  provider_type: string;
  license_type: string;
  taxonomy_code: string;
  medicare_id: string;
  medicaid_id: string;
  provider_verification_type: string;
  verification_sources: string[];
  verification_type: string;
  hospital_name: string;
  specialty: string;
  organization_name: string;
}

export class PractitionerDataMapper {
  /**
   * Map practitioner data to NPI verification request format
   */
  static mapToNPIRequest(practitionerData: PractitionerContext, documentUrl?: string) {
    return {
      npi: practitionerData.npi,
      first_name: practitionerData.first_name,
      last_name: practitionerData.last_name,
      organization_name: practitionerData.organization_name,
      city: practitionerData.city,
      state: practitionerData.state,
      postal_code: practitionerData.postal_code
      // Note: document_url is not in the backend request model
    };
  }

  /**
   * Map practitioner data to DEA verification request format
   */
  static mapToDEARequest(practitionerData: PractitionerContext, documentUrl?: string) {
    return {
      first_name: practitionerData.first_name,
      last_name: practitionerData.last_name,
      dea_number: practitionerData.dea_number
      // Note: document_url is not in the backend request model
    };
  }

  /**
   * Map practitioner data to ABMS verification request format
   */
  static mapToABMSRequest(practitionerData: PractitionerContext, documentUrl?: string) {
    return {
      first_name: practitionerData.first_name,
      last_name: practitionerData.last_name,
      middle_name: practitionerData.middle_name,
      state: practitionerData.state,
      npi_number: practitionerData.npi_number,
      active_state_medical_license: practitionerData.license_number,
      specialty: practitionerData.specialty
      // Note: document_url is not in the backend request model
    };
  }

  /**
   * Map practitioner data to NPDB verification request format
   */
  static mapToNPDBRequest(practitionerData: PractitionerContext, documentUrl?: string) {
    return {
      first_name: practitionerData.first_name,
      last_name: practitionerData.last_name,
      date_of_birth: practitionerData.date_of_birth,
      ssn_last4: practitionerData.ssn_last4,
      address: practitionerData.address || {
        line1: '',
        line2: '',
        city: practitionerData.city,
        state: practitionerData.state,
        zip: practitionerData.zip
      },
      npi_number: practitionerData.npi_number,
      license_number: practitionerData.license_number,
      state_of_license: practitionerData.state_of_license,
      dea_number: practitionerData.dea_number,
      organization_name: practitionerData.organization_name
      // Note: document_url is not in the backend request model
    };
  }

  /**
   * Map practitioner data to comprehensive sanctions check request format
   */
  static mapToSanctionsRequest(practitionerData: PractitionerContext, documentUrl?: string) {
    return {
      first_name: practitionerData.first_name,
      last_name: practitionerData.last_name,
      date_of_birth: practitionerData.date_of_birth,
      npi: practitionerData.npi,
      license_number: practitionerData.license_number,
      license_state: practitionerData.license_state,
      ssn_last4: practitionerData.ssn_last4
      // Note: document_url is not in the backend request model
    };
  }

  /**
   * Map practitioner data to LADMF verification request format
   */
  static mapToLADMFRequest(practitionerData: PractitionerContext, documentUrl?: string) {
    return {
      first_name: practitionerData.first_name,
      last_name: practitionerData.last_name,
      middle_name: practitionerData.middle_name,
      date_of_birth: practitionerData.date_of_birth,
      social_security_number: practitionerData.social_security_number
      // Note: document_url is not in the backend request model
    };
  }

  /**
   * Map practitioner data to Medical verification request format
   */
  static mapToMedicalRequest(practitionerData: PractitionerContext, documentUrl?: string) {
    return {
      npi: practitionerData.npi,
      first_name: practitionerData.first_name,
      last_name: practitionerData.last_name,
      license_type: practitionerData.license_type,
      taxonomy_code: practitionerData.taxonomy_code,
      provider_type: practitionerData.provider_type,
      city: practitionerData.city,
      state: practitionerData.state,
      zip: practitionerData.zip
      // Note: document_url is not in the backend request model
    };
  }

  /**
   * Map practitioner data to DCA (CA License) verification request format
   */
  static mapToDCARequest(practitionerData: PractitionerContext, documentUrl?: string) {
    return {
      first_name: practitionerData.first_name,
      last_name: practitionerData.last_name,
      license_number: practitionerData.license_number
      // Note: document_url is not in the backend request model
    };
  }

  /**
   * Map practitioner data to Medicare verification request format
   */
  static mapToMedicareRequest(practitionerData: PractitionerContext, documentUrl?: string) {
    return {
      provider_verification_type: practitionerData.provider_verification_type,
      npi: practitionerData.npi,
      first_name: practitionerData.first_name,
      last_name: practitionerData.last_name,
      specialty: practitionerData.specialty,
      verification_sources: practitionerData.verification_sources
      // Note: document_url is not in the backend request model
    };
  }

  /**
   * Map practitioner data to Education verification request format
   */
  static mapToEducationRequest(practitionerData: PractitionerContext, documentUrl?: string) {
    return {
      first_name: practitionerData.first_name,
      last_name: practitionerData.last_name,
      institution: practitionerData.institution,
      degree_type: practitionerData.degree_type,
      graduation_year: practitionerData.graduation_year,
      verification_type: practitionerData.verification_type
      // Note: document_url is not in the backend request model
    };
  }

  /**
   * Map practitioner data to Hospital Privileges verification request format
   */
  static mapToHospitalPrivilegesRequest(practitionerData: PractitionerContext, documentUrl?: string) {
    return {
      first_name: practitionerData.first_name,
      last_name: practitionerData.last_name,
      npi_number: practitionerData.npi_number,
      hospital_name: practitionerData.hospital_name,
      specialty: practitionerData.specialty,
      verification_type: 'current_privileges'
      // Note: document_url is not in the backend request model
    };
  }

  /**
   * Map practitioner data to the appropriate request format based on step ID
   */
  static mapToRequestFormat(stepId: string, practitionerData: PractitionerContext, documentUrl?: string) {
    switch (stepId) {
      case 'npi_verification':
        return this.mapToNPIRequest(practitionerData, documentUrl);
      
      case 'dea_verification':
        return this.mapToDEARequest(practitionerData, documentUrl);
      
      case 'abms_verification':
        return this.mapToABMSRequest(practitionerData, documentUrl);
      
      case 'npdb_verification':
        return this.mapToNPDBRequest(practitionerData, documentUrl);
      
      case 'sanction_check':
        return this.mapToSanctionsRequest(practitionerData, documentUrl);
      
      case 'ladmf_verification':
        return this.mapToLADMFRequest(practitionerData, documentUrl);
      
      case 'medical_verification':
        return this.mapToMedicalRequest(practitionerData, documentUrl);
      
      case 'ca_license_verification':
        return this.mapToDCARequest(practitionerData, documentUrl);
      
      case 'medicare_verification':
        return this.mapToMedicareRequest(practitionerData, documentUrl);
      
      case 'education_verification':
        return this.mapToEducationRequest(practitionerData, documentUrl);
      
      case 'hospital_privileges':
        return this.mapToHospitalPrivilegesRequest(practitionerData, documentUrl);
      
      default:
        // Generic fallback
        return {
          first_name: practitionerData.first_name,
          last_name: practitionerData.last_name,
          npi: practitionerData.npi
          // Note: document_url is not in the backend request model
        };
    }
  }
} 