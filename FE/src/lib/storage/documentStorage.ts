import { createClient } from '@/utils/supabase/client';
import { createAdminClient } from '@/utils/supabase/supabase-admin';

export interface DocumentMetadata {
  practitionerId: number;
  stepName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  timestamp: string;
  documentUrl?: string;
}

export interface StoredDocument {
  path: string;
  url: string;
  metadata: DocumentMetadata;
  createdAt: string;
}

export class DocumentStorageService {
  private static readonly BUCKET_NAME = 'vera-documents';
  
  /**
   * Generate storage path for a document
   */
  private static generateStoragePath(practitionerId: number, stepName: string, timestamp: string, fileName: string): string {
    return `${practitionerId}/${stepName}_verification_${timestamp}_${fileName}`;
  }

  /**
   * Upload a document to the vera-documents bucket
   */
  static async uploadDocument(
    practitionerId: number,
    stepName: string,
    file: File
  ): Promise<StoredDocument> {
    const supabase = createClient();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = this.generateStoragePath(practitionerId, stepName, timestamp, fileName);

    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Failed to upload document: ${error.message}`);
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(storagePath);

    const metadata: DocumentMetadata = {
      practitionerId,
      stepName,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      timestamp,
      documentUrl: urlData.publicUrl
    };

    return {
      path: storagePath,
      url: urlData.publicUrl,
      metadata,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Retrieve all documents for a practitioner's verification step
   */
  static async getDocumentsForStep(
    practitionerId: number,
    stepName: string
  ): Promise<StoredDocument[]> {
    const supabase = createClient();
    const folderPath = `${practitionerId}/`;
    // Allow both naming conventions:
    // 1. <stepKey>_verification_<timestamp>_<file>.pdf  (frontend uploads)
    // 2. <stepKey>_<timestamp>_<id>.pdf                (backend-generated PDFs)
    const stepPrefixWithVerification = `${stepName}_verification_`;
    const stepPrefixWithoutVerification = `${stepName}_`;

    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      throw new Error(`Failed to retrieve documents: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // Filter files that match either naming pattern and ignore "folders"
    const stepFiles = data.filter(file =>
      !file.name.endsWith('/') &&
      (file.name.startsWith(stepPrefixWithVerification) || file.name.startsWith(stepPrefixWithoutVerification))
    );

    // Convert to StoredDocument format
    const documents: StoredDocument[] = [];
    
    for (const file of stepFiles) {
      const filePath = `${folderPath}${file.name}`;
      
      // Get signed URL instead of public URL for better security and reliability
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (signedUrlError) {
        console.error(`Failed to create signed URL for ${filePath}:`, signedUrlError);
        continue; // Skip this file if we can't get a signed URL
      }

      // Parse metadata from filename
      const parts = file.name.split('_');
      const timestampPart = parts.find(part => part.match(/^\d{4}-\d{2}-\d{2}T/));
      const timestamp = timestampPart ? timestampPart.replace(/-/g, ':').replace(/T/, 'T') : '';
      
      const metadata: DocumentMetadata = {
        practitionerId,
        stepName,
        fileName: file.name,
        fileSize: file.metadata?.size || 0,
        mimeType: file.metadata?.mimetype || 'application/pdf',
        timestamp,
        documentUrl: signedUrlData?.signedUrl
      };

      documents.push({
        path: filePath,
        url: signedUrlData?.signedUrl || '',
        metadata,
        createdAt: file.created_at || new Date().toISOString()
      });
    }

    return documents.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Delete a document from storage
   */
  static async deleteDocument(path: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([path]);

    if (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  /**
   * Check if documents exist for a verification step
   */
  static async hasDocumentsForStep(
    practitionerId: number,
    stepName: string
  ): Promise<boolean> {
    try {
      const documents = await this.getDocumentsForStep(practitionerId, stepName);
      return documents.length > 0;
    } catch (error) {
      console.error('Error checking for documents:', error);
      return false;
    }
  }

  /**
   * Get the most recent document for a verification step
   */
  static async getLatestDocumentForStep(
    practitionerId: number,
    stepName: string
  ): Promise<StoredDocument | null> {
    try {
      const documents = await this.getDocumentsForStep(practitionerId, stepName);
      return documents.length > 0 ? documents[0] : null;
    } catch (error) {
      console.error('Error getting latest document:', error);
      return null;
    }
  }

  /**
   * Generate a signed URL for temporary access to a document
   */
  static async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    const supabase = createAdminClient();

    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }
}

// Export convenience functions
export const documentStorage = {
  upload: DocumentStorageService.uploadDocument,
  getForStep: DocumentStorageService.getDocumentsForStep,
  hasDocuments: DocumentStorageService.hasDocumentsForStep,
  getLatest: DocumentStorageService.getLatestDocumentForStep,
  delete: DocumentStorageService.deleteDocument,
  getSignedUrl: DocumentStorageService.getSignedUrl
}; 