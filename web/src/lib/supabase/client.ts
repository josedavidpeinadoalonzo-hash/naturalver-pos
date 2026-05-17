import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let _client: SupabaseClient | null = null;

if (typeof window !== "undefined" || (supabaseUrl && supabaseAnonKey)) {
  try {
    _client = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder", {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  } catch {}
}

const handler: ProxyHandler<SupabaseClient> = {
  get(_, prop: string | symbol) {
    if (!_client) {
      if (prop === "from") return () => { throw new Error("Supabase: configure .env.local"); };
      return undefined as any;
    }
    const val = (_client as any)[prop];
    return typeof val === "function" ? val.bind(_client) : val;
  },
};

export const supabase = new Proxy({} as SupabaseClient, handler);
