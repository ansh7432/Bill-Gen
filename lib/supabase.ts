import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for server-side components
export const createServerClient = () => {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// For client components, we need to use a singleton pattern to avoid
// creating a new client on every render
let clientInstance: ReturnType<typeof createClient> | null = null

export const createBrowserClient = () => {
  if (clientInstance) return clientInstance

  clientInstance = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  return clientInstance
}
