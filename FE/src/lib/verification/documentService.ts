import { VerificationAPI } from '@/lib/api/verification';
import { documentStorage, StoredDocument } from '@/lib/storage/documentStorage';
import { auditTrailService } from '@/lib/audit';
import { PractitionerDataMapper, type PractitionerContext } from './practitionerDataMapper';

export interface DocumentRequestOptions {
  practitionerId: number;
  stepId: string;
  stepName: string;
  applicationId: number;
  requestedBy: string;
  practitionerData?: PractitionerContext;
}

export interface DocumentRetrievalResult {
  hasExistingDocuments: boolean;
  documents: StoredDocument[];
  newDocumentRequested: boolean;
  documentUrl?: string;
  error?: string;
}

export class VerificationDocumentService {
  /**
   * Check if a verification step is in progress
   */
  static isStepInProgress(stepStatus: string): boolean {
    return stepStatus === 'in_progress';
  }

  /**
   * Retrieve existing documents for a verification step
   * Checks both storage and audit trail for document URLs
   */
  static async getExistingDocuments(
    practitionerId: number,
    stepId: string,
    applicationId?: number
  ): Promise<StoredDocument[]> {
    try {
      // First try to get documents from storage
      const storageDocuments = await documentStorage.getForStep(practitionerId, stepId);
      
      // If we have an application ID, also check audit trail for document URLs
      if (applicationId) {
        try {
          const auditEntries = await auditTrailService.getApplicationAuditTrail(applicationId);
          
          // Find audit entries for this step that contain document URLs
          const stepAuditEntries = auditEntries.filter(entry => 
            entry.step_key === stepId && 
            entry.data && 
            typeof entry.data === 'object' && 
            'document_url' in entry.data && 
            entry.data.document_url
          );
          
          // Convert audit entries to StoredDocument format
          const auditDocuments: StoredDocument[] = stepAuditEntries.map(entry => {
            const data = entry.data as any;
            const timestamp = data.generated_at || entry.timestamp;
            const fileName = data.document_filename || `${stepId}_${timestamp.split('T')[0]}.pdf`;
            
            return {
              path: `${practitionerId}/${fileName}`,
              url: data.document_url,
              metadata: {
                practitionerId,
                stepName: stepId,
                fileName,
                fileSize: 0,
                mimeType: 'application/pdf',
                timestamp,
                documentUrl: data.document_url
              },
              createdAt: timestamp
            };
          });
          
          // Combine storage and audit documents, removing duplicates by URL
          const allDocuments = [...storageDocuments, ...auditDocuments];
          const uniqueDocuments = allDocuments.filter((doc, index, self) => 
            index === self.findIndex(d => d.url === doc.url)
          );
          
          return uniqueDocuments.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
        } catch (auditError) {
          console.error('Error retrieving documents from audit trail:', auditError);
          // Fall back to storage documents only
          return storageDocuments;
        }
      }
      
      return storageDocuments;
    } catch (error) {
      console.error('Error retrieving existing documents:', error);
      return [];
    }
  }

  /**
   * Request a new verification document
   */
  static async requestNewDocument(
    options: DocumentRequestOptions
  ): Promise<DocumentRetrievalResult> {
    const { practitionerId, stepId, stepName, applicationId, requestedBy, practitionerData } = options;

    try {
      // First, check for existing documents
      const existingDocuments = await VerificationDocumentService.getExistingDocuments(practitionerId, stepId, applicationId);

      // Log the document request in audit trail
      await auditTrailService.recordChange({
        application_id: applicationId,
        step_key: stepId,
        status: 'in_progress',
        notes: `Requested new ${stepName} document`,
        changed_by: requestedBy,
        data: {
          document_requested: true,
          requested_at: new Date().toISOString(),
          existing_documents_count: existingDocuments.length,
          practitioner_data: practitionerData
        }
      });

      // Make the verification API call to generate the document
      let documentUrl: string | undefined;
      let newDocument: StoredDocument | undefined;
      
      if (practitionerData) {
        try {
          const apiResult = await VerificationDocumentService.makeVerificationAPICall(stepId, practitionerData, requestedBy);
          documentUrl = apiResult?.document_url;
          
          // If we got a document URL, create a StoredDocument object for immediate UI display
          if (documentUrl) {
            const timestamp = new Date().toISOString();
            const fileName = `${stepName.replace(/\s+/g, '_')}_${timestamp.split('T')[0]}.pdf`;
            
            newDocument = {
              path: `${practitionerId}/${fileName}`,
              url: documentUrl,
              metadata: {
                practitionerId,
                stepName,
                fileName,
                fileSize: 0, // Unknown size for API-generated documents
                mimeType: 'application/pdf',
                timestamp,
                documentUrl
              },
              createdAt: timestamp
            };

            // Record the successful document generation in audit trail
            await auditTrailService.recordChange({
              application_id: applicationId,
              step_key: stepId,
              status: 'in_progress',
              notes: `Successfully generated ${stepName} document`,
              changed_by: requestedBy,
              data: {
                document_generated: true,
                document_url: documentUrl,
                document_filename: fileName,
                generated_at: timestamp,
                practitioner_data: practitionerData
              }
            });
          }
        } catch (apiError) {
          console.error('Verification API call failed:', apiError);
          // Continue with the workflow even if API fails
        }
      }

      // Combine existing documents with new document if available
      const allDocuments = newDocument ? [...existingDocuments, newDocument] : existingDocuments;

      return {
        hasExistingDocuments: existingDocuments.length > 0,
        documents: allDocuments,
        newDocumentRequested: true,
        documentUrl,
      };

    } catch (error) {
      console.error('Error requesting new document:', error);
      
      // Log the error in audit trail
      await auditTrailService.recordChange({
        application_id: applicationId,
        step_key: stepId,
        status: 'in_progress',
        notes: `Failed to request ${stepName} document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        changed_by: requestedBy,
        data: {
          document_request_failed: true,
          error: error instanceof Error ? error.message : 'Unknown error',
          failed_at: new Date().toISOString()
        }
      });

      return {
        hasExistingDocuments: false,
        documents: [],
        newDocumentRequested: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle the complete document workflow for a verification step
   */
  static async handleDocumentWorkflow(
    options: DocumentRequestOptions,
    stepStatus: string
  ): Promise<DocumentRetrievalResult> {
    const { practitionerId, stepId } = options;

    // Always request new document for in-progress steps to check for both existing and new documents
    if (VerificationDocumentService.isStepInProgress(stepStatus)) {
      return await VerificationDocumentService.requestNewDocument(options);
    }

    // For non-in-progress steps, just check for existing documents
    const existingDocuments = await VerificationDocumentService.getExistingDocuments(practitionerId, stepId, options.applicationId);
    
    return {
      hasExistingDocuments: existingDocuments.length > 0,
      documents: existingDocuments,
      newDocumentRequested: false
    };
  }

  /**
   * Make the appropriate verification API call based on step ID
   */
  private static async makeVerificationAPICall(
    stepId: string,
    practitionerData: PractitionerContext,
    userId?: string
  ): Promise<any> {
    if (!practitionerData) {
      throw new Error('Practitioner data is required for verification API calls');
    }

    // Use the mapper to get the correctly formatted request data
    const documentUrl = 'GENERATE_DOCUMENT'; // Signal to backend to generate document

    // Prepare headers for document generation (X-User-ID only)
    const headers = {
      'X-User-ID': userId || 'unknown'
    };

    switch (stepId) {
      case 'npi_verification':
        return await VerificationAPI.searchNPI(PractitionerDataMapper.mapToNPIRequest(practitionerData, documentUrl), headers, true);
      
      case 'dea_verification':
        return await VerificationAPI.verifyDEA(PractitionerDataMapper.mapToDEARequest(practitionerData, documentUrl), headers, true);
      
      case 'abms_verification':
        return await VerificationAPI.lookupABMSCertification(PractitionerDataMapper.mapToABMSRequest(practitionerData, documentUrl), headers, true);
      
      case 'npdb_verification':
        return await VerificationAPI.verifyNPDB(PractitionerDataMapper.mapToNPDBRequest(practitionerData, documentUrl), headers, true);
      
      case 'sanction_check':
        return await VerificationAPI.comprehensiveSanctionsCheck(PractitionerDataMapper.mapToSanctionsRequest(practitionerData, documentUrl), headers, true);
      
      case 'ladmf_verification':
        return await VerificationAPI.verifyLADMF(PractitionerDataMapper.mapToLADMFRequest(practitionerData, documentUrl), headers, true);
      
      case 'medical_verification':
        return await VerificationAPI.verifyMedical(PractitionerDataMapper.mapToMedicalRequest(practitionerData, documentUrl), headers, true);
      
      case 'ca_license_verification':
        return await VerificationAPI.verifyDCALicense(PractitionerDataMapper.mapToDCARequest(practitionerData, documentUrl), headers, true);
      
      case 'medicare_verification':
        return await VerificationAPI.verifyMedicare(PractitionerDataMapper.mapToMedicareRequest(practitionerData, documentUrl), headers, true);
      
      case 'education_verification':
        return await VerificationAPI.verifyEducation(PractitionerDataMapper.mapToEducationRequest(practitionerData, documentUrl), headers, true);
      
      case 'hospital_privileges':
        return await VerificationAPI.verifyHospitalPrivileges(PractitionerDataMapper.mapToHospitalPrivilegesRequest(practitionerData, documentUrl), headers, true);
      
      default:
        throw new Error(`Unsupported verification step: ${stepId}`);
    }
  }

  /**
   * Remove a document from storage and update audit trail
   */
  static async removeDocument(
    documentPath: string,
    options: {
      practitionerId: number;
      stepId: string;
      stepName: string;
      applicationId: number;
      removedBy: string;
    }
  ): Promise<void> {
    const { practitionerId, stepId, stepName, applicationId, removedBy } = options;

    try {
      // Remove from storage
      await documentStorage.delete(documentPath);

      // Log the removal in audit trail
      await auditTrailService.recordChange({
        application_id: applicationId,
        step_key: stepId,
        status: 'in_progress',
        notes: `Removed ${stepName} document`,
        changed_by: removedBy,
        data: {
          document_removed: true,
          document_path: documentPath,
          removed_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error removing document:', error);
      throw error;
    }
  }

  /**
   * Upload a new document to storage and update audit trail
   */
  static async uploadDocument(
    file: File,
    options: {
      practitionerId: number;
      stepId: string;
      stepName: string;
      applicationId: number;
      uploadedBy: string;
    }
  ): Promise<StoredDocument> {
    const { practitionerId, stepId, stepName, applicationId, uploadedBy } = options;

    try {
      // Upload to storage
      const storedDocument = await documentStorage.upload(practitionerId, stepId, file);

      // Log the upload in audit trail
      await auditTrailService.recordChange({
        application_id: applicationId,
        step_key: stepId,
        status: 'in_progress',
        notes: `Uploaded ${stepName} document: ${file.name}`,
        changed_by: uploadedBy,
        data: {
          document_uploaded: true,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          document_url: storedDocument.url,
          uploaded_at: new Date().toISOString()
        }
      });

      return storedDocument;

    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }
}

// Export convenience functions
export const verificationDocumentService = {
  getExisting: (practitionerId: number, stepId: string, applicationId?: number) => 
    VerificationDocumentService.getExistingDocuments(practitionerId, stepId, applicationId),
  requestNew: VerificationDocumentService.requestNewDocument,
  handleWorkflow: VerificationDocumentService.handleDocumentWorkflow,
  remove: VerificationDocumentService.removeDocument,
  upload: VerificationDocumentService.uploadDocument,
  isInProgress: VerificationDocumentService.isStepInProgress
}; 