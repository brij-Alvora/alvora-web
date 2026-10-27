import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

export function getAdminClientOrNull() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createAdminClient() {
  const client = getAdminClientOrNull();
  if (!client) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local from Supabase → Project Settings → API → service_role.",
    );
  }
  return client;
}
