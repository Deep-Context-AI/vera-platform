import { createClient } from '@/utils/supabase/client';
import type { 
  Application, 
  ApplicationWithDetails,
  ApplicationDetailsView,
  CreateApplicationRequest, 
  UpdateApplicationRequest,
  ApplicationStatus,
  VerificationStatus,
  Practitioner,
  Attestation
} from '@/types/applications';

export class ApplicationsAPI {
  private static getClient() {
    return createClient();
  }

  /**
   * Get the comprehensive select string for applications with all related data
   */
  private static getDetailedSelectString(): string {
    return `
      *,
      practitioners:provider_id (
        id,
        first_name,
        last_name,
        middle_name,
        suffix,
        education,
        other_names,
        home_address,
        mailing_address,
        demographics,
        languages
      ),
      npi:npi_number (
        id,
        number,
        type,
        status,
        taxonomy_code,
        description
      )
    `;
  }

  /**
   * Fetch all applications with comprehensive details including practitioner and NPI information
   */
  static async getApplications(options?: {
    status?: ApplicationStatus;
    provider_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ApplicationWithDetails[] | null; error: any }> {
    try {
      const client = this.getClient();
      let query = client
        .schema('vera')
        .from('applications')
        .select(this.getDetailedSelectString())
        .order('created_at', { ascending: false });

      // Apply filters
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      
      if (options?.provider_id) {
        query = query.eq('provider_id', options.provider_id);
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
      }

      const { data, error } = await query;
      
      return { data: data as ApplicationWithDetails[] | null, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Fetch a single application by ID with full details
   */
  static async getApplication(
    id: number
  ): Promise<{ data: ApplicationWithDetails | null; error: any }> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .schema('vera')
        .from('applications')
        .select(this.getDetailedSelectString())
        .eq('id', id)
        .single();

      return { data: data as ApplicationWithDetails | null, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Create a new application
   */
  static async createApplication(
    application: CreateApplicationRequest
  ): Promise<{ data: Application | null; error: any }> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .schema('vera')
        .from('applications')
        .insert(application)
        .select()
        .single();

      return { data: data as Application | null, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Update an existing application
   */
  static async updateApplication(
    application: UpdateApplicationRequest
  ): Promise<{ data: Application | null; error: any }> {
    try {
      const client = this.getClient();
      const { id, ...updateData } = application;
      
      const { data, error } = await client
        .schema('vera')
        .from('applications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      return { data: data as Application | null, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Delete an application
   */
  static async deleteApplication(
    id: number
  ): Promise<{ error: any }> {
    try {
      const client = this.getClient();
      const { error } = await client
        .schema('vera')
        .from('applications')
        .delete()
        .eq('id', id);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Get applications by status with counts
   */
  static async getApplicationsByStatus(): Promise<{ data: { status: string; count: number }[] | null; error: any }> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .schema('vera')
        .from('applications')
        .select('status')
        .not('status', 'is', null);

      if (error) return { data: null, error };

      // Group by status and count
      const statusCounts = (data as { status: string }[]).reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const result = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count
      }));

      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Search applications by provider name, NPI number, or license number with full details
   */
  static async searchApplications(
    searchTerm: string
  ): Promise<{ data: ApplicationWithDetails[] | null; error: any }> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .schema('vera')
        .from('applications')
        .select(this.getDetailedSelectString())
        .or(`
          npi_number.ilike.%${searchTerm}%,
          license_number.ilike.%${searchTerm}%,
          dea_number.ilike.%${searchTerm}%,
          practitioners.first_name.ilike.%${searchTerm}%,
          practitioners.last_name.ilike.%${searchTerm}%
        `)
        .order('created_at', { ascending: false });

      return { data: data as ApplicationWithDetails[] | null, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get recent applications with full details (last 30 days)
   */
  static async getRecentApplications(
    limit = 10
  ): Promise<{ data: ApplicationWithDetails[] | null; error: any }> {
    try {
      const client = this.getClient();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await client
        .schema('vera')
        .from('applications')
        .select(this.getDetailedSelectString())
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      return { data: data as ApplicationWithDetails[] | null, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Update application status
   */
  static async updateApplicationStatus(
    id: number,
    status: ApplicationStatus
  ): Promise<{ data: Application | null; error: any }> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .schema('vera')
        .from('applications')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      return { data: data as Application | null, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get applications by practitioner with verification status
   */
  static async getApplicationsByPractitioner(
    practitionerId: number
  ): Promise<{ data: ApplicationWithDetails[] | null; error: any }> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .schema('vera')
        .from('applications')
        .select(this.getDetailedSelectString())
        .eq('provider_id', practitionerId)
        .order('created_at', { ascending: false });

      return { data: data as ApplicationWithDetails[] | null, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get applications with NPI verification issues
   */
  static async getApplicationsWithNPIIssues(): Promise<{ data: ApplicationWithDetails[] | null; error: any }> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .schema('vera')
        .from('applications')
        .select(this.getDetailedSelectString())
        .or('npi_number.is.null,npi.status.neq.Active')
        .order('created_at', { ascending: false });

      return { data: data as ApplicationWithDetails[] | null, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Query the application_details view directly for comprehensive provider information
   * This method uses the database view for optimized queries with computed fields
   */
  static async getApplicationDetailsFromView(options?: {
    status?: ApplicationStatus;
    verification_status?: VerificationStatus;
    practitioner_name?: string;
    npi_taxonomy_code?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ApplicationDetailsView[] | null; error: any }> {
    try {
      const client = this.getClient();
      let query = client
        .schema('vera')
        .from('application_details')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      
      if (options?.verification_status) {
        query = query.eq('verification_status', options.verification_status);
      }
      
      if (options?.practitioner_name) {
        query = query.or(`
          practitioner_first_name.ilike.%${options.practitioner_name}%,
          practitioner_last_name.ilike.%${options.practitioner_name}%,
          full_name.ilike.%${options.practitioner_name}%
        `);
      }
      
      if (options?.npi_taxonomy_code) {
        query = query.eq('npi_taxonomy_code', options.npi_taxonomy_code);
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
      }

      const { data, error } = await query;
      
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Search applications using the view with enhanced search capabilities
   */
  static async searchApplicationDetailsFromView(
    searchTerm: string
  ): Promise<{ data: ApplicationDetailsView[] | null; error: any }> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .schema('vera')
        .from('application_details')
        .select('*')
        .or(`
          npi_number.ilike.%${searchTerm}%,
          license_number.ilike.%${searchTerm}%,
          dea_number.ilike.%${searchTerm}%,
          practitioner_first_name.ilike.%${searchTerm}%,
          practitioner_last_name.ilike.%${searchTerm}%,
          full_name.ilike.%${searchTerm}%,
          npi_taxonomy_code.ilike.%${searchTerm}%,
          npi_description.ilike.%${searchTerm}%
        `)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get verification statistics from the view
   */
  static async getVerificationStats(): Promise<{ data: any | null; error: any }> {
    try {
      const client = this.getClient();
      
      // Get counts by verification status
      const { data: statusData, error: statusError } = await client
        .schema('vera')
        .from('application_details')
        .select('verification_status')
        .not('verification_status', 'is', null);

      if (statusError) return { data: null, error: statusError };

      // Get counts by NPI type
      const { data: typeData, error: typeError } = await client
        .schema('vera')
        .from('application_details')
        .select('npi_type')
        .not('npi_type', 'is', null);

      if (typeError) return { data: null, error: typeError };

      // Process the data
      const verificationStats = (statusData as { verification_status: string }[]).reduce((acc, item) => {
        acc[item.verification_status] = (acc[item.verification_status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const npiTypeStats = (typeData as { npi_type: string }[]).reduce((acc, item) => {
        acc[item.npi_type] = (acc[item.npi_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return { 
        data: {
          verificationStatus: verificationStats,
          npiTypes: npiTypeStats,
          totalApplications: statusData.length
        }, 
        error: null 
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get a single practitioner by ID
   */
  static async getPractitioner(
    id: number
  ): Promise<{ data: Practitioner | null; error: any }> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .schema('vera')
        .from('practitioners')
        .select('*')
        .eq('id', id)
        .single();

      return { data: data as Practitioner | null, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get attestations by practitioner ID
   */
  static async getAttestationsByPractitioner(
    practitionerId: number
  ): Promise<{ data: Attestation[] | null; error: any }> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .schema('vera')
        .from('attestations')
        .select('*')
        .eq('practitioner_id', practitionerId);
      console.log('Attestations:', data);
      return { data: data as Attestation[] | null, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get provider details from the application_details view by provider_id
   */
  static async getProviderDetails(
    providerId: number
  ): Promise<{ data: ApplicationDetailsView | null; error: any }> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .schema('vera')
        .from('application_details')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }
} 