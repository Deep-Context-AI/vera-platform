import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/database.types";

/**
 * Creates a Supabase admin client with direct access, not tied to user sessions
 * Useful for server-side operations like audit logging
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { 
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
} 

/**
 * Creates an audit log entry for tracking changes to entities
 * @param entityId - ID of the entity being modified
 * @param action - The action being performed (create, update, delete)
 * @param oldValues - Previous values before change (null for create)
 * @param newValues - New values after change (null for delete)
 * @param userId - ID of the user making the change (optional)
 */
export async function createAuditLog({
  entityId,
  action,
  oldValues = null,
  newValues = null,
  userId = null
}: {
  entityId: string;
  action: string;
  oldValues?: Json | null;
  newValues?: Json | null;
  userId?: string | null;
}) {
  const supabase = createAdminClient();
  
  const { error } = await supabase.from("audit_logs").insert({
    entity_id: entityId,
    action,
    old_values: oldValues,
    new_values: newValues,
    changed_by: userId,
    changed_at: new Date().toISOString()
  });
  
  if (error) {
    console.error("Error creating audit log:", error);
  }
  
  return { error };
} 