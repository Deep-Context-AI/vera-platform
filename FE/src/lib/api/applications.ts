import { createClient } from '@/utils/supabase/client';
import type { 
  Application, 
  CreateApplicationRequest, 
  UpdateApplicationRequest,
  ApplicationStatus 
} from '@/types/applications';

export class ApplicationsAPI {
  private static getClient() {
    return createClient();
  }

  /**
   * Fetch all applications with optional filtering
   */
  static async getApplications(options?: {
    status?: ApplicationStatus;
    provider_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Application[] | null; error: any }> {
    try {
      const client = this.getClient();
      let query = client
        .schema('vera')
        .from('applications')
        .select('*')
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
      
      return { data: data as Application[] | null, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Fetch a single application by ID
   */
  static async getApplication(
    id: number
  ): Promise<{ data: Application | null; error: any }> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .schema('vera')
        .from('applications')
        .select('*')
        .eq('id', id)
        .single();

      return { data: data as Application | null, error };
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
   * Search applications by provider name or NPI
   */
  static async searchApplications(
    searchTerm: string
  ): Promise<{ data: Application[] | null; error: any }> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .schema('vera')
        .from('applications')
        .select(`
          *,
          practitioners!provider_id (
            first_name,
            last_name
          )
        `)
        .or(`npi_number.ilike.%${searchTerm}%,license_number.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      return { data: data as Application[] | null, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get recent applications (last 30 days)
   */
  static async getRecentApplications(
    limit = 10
  ): Promise<{ data: Application[] | null; error: any }> {
    try {
      const client = this.getClient();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await client
        .schema('vera')
        .from('applications')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      return { data: data as Application[] | null, error };
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
} 