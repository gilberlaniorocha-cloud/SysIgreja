import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

// Ensure the URL is valid to prevent crashes before the user configures it
const getValidUrl = (url?: string) => {
  if (!url) return 'https://placeholder.supabase.co';
  
  let cleanUrl = url.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }
  
  try {
    new URL(cleanUrl);
    return cleanUrl;
  } catch (e) {
    return 'https://placeholder.supabase.co';
  }
};

const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  const response = await fetch(url, options);
  
  if (typeof window !== 'undefined' && response.status === 400) {
    try {
      const clonedResponse = response.clone();
      const data = await clonedResponse.json();
      
      if (
        data && 
        ((data.error_description && (data.error_description.includes('Refresh Token Not Found') || data.error_description.includes('Invalid Refresh Token'))) ||
         (data.msg && (data.msg.includes('Refresh Token Not Found') || data.msg.includes('Invalid Refresh Token'))))
      ) {
        console.warn('Stale session detected in fetch, clearing storage...');
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes('supabase')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  }
  
  return response;
};

export const supabase = createClient<Database>(
  getValidUrl(supabaseUrl),
  supabaseAnonKey.trim(),
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      fetch: customFetch
    }
  }
);

// Add a global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason && 
      event.reason.message && 
      (event.reason.message.includes('Refresh Token Not Found') || 
       event.reason.message.includes('refresh_token_not_found') ||
       event.reason.message.includes('Invalid Refresh Token'))
    ) {
      console.warn('Stale session detected globally, clearing storage...');
      // Clear all supabase storage keys
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('supabase')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      // Prevent the error from showing up in the console/UI
      event.preventDefault();
      // Redirect to login
      window.location.href = '/login';
    }
  });
}
