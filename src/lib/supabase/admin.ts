import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Service-role client for trusted server-only jobs (e.g. the notification
 * cron) that need to read/write across all users, bypassing RLS. Never
 * import this from client code or any request path that isn't already
 * authenticated as the app itself (the service role key must never reach
 * the browser).
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
