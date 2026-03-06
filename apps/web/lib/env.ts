export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// .env.local uses API_URL / ANON_KEY / SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix for local dev)
export const env = {
  supabaseUrl:
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.API_URL ??
    (process.env.NODE_ENV === 'production' ? '' : 'http://127.0.0.1:54321'),
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.ANON_KEY ??
    '',
  supabaseServiceRoleKey:
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SERVICE_ROLE_KEY ??
    '',
  backendBaseUrl:
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    process.env.BACKEND_URL ??
    (process.env.NODE_ENV === 'production' ? 'https://quicksaas1.onrender.com' : 'http://localhost:4000'),
};
