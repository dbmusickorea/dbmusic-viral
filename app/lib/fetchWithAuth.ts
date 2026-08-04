import { supabase } from './supabase'

export async function fetchWithAuth(url: string, options?: RequestInit) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  })
}
