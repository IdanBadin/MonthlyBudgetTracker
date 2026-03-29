import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please connect to Supabase using the "Connect to Supabase" button.');
}

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

const retryOperation = async (
  operation: () => Promise<any>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY,
  signal?: AbortSignal
) => {
  try {
    if (signal?.aborted) throw new Error('Operation aborted');
    return await operation();
  } catch (error) {
    if (retries > 0 && !signal?.aborted) {
      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(resolve, delay);
        if (signal) {
          signal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            reject(new Error('Operation aborted'));
          }, { once: true });
        }
      });
      return retryOperation(operation, retries - 1, delay * 2, signal);
    }
    throw error;
  }
};

// Create Supabase client with enhanced auth handling
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: {
      getItem: async (key) => {
        try {
          const item = localStorage.getItem(key);
          if (!item) return null;
          
          const session = JSON.parse(item);
          
          // Check if session exists and is not expired
          if (session?.expires_at) {
            const expiresAt = new Date(session.expires_at).getTime();
            const now = new Date().getTime();
            
            // If session is expired, remove it and return null
            if (now >= expiresAt) {
              localStorage.removeItem(key);
              return null;
            }
          }
          
          return session;
        } catch {
          // If there's any error parsing the session, remove it
          localStorage.removeItem(key);
          return null;
        }
      },
      setItem: async (key, value) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.error('Error storing auth session:', error);
        }
      },
      removeItem: async (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing auth session:', error);
        }
      },
    },
  },
  global: {
    fetch: (...args) => {
      return retryOperation(async () => {
        const response = await fetch(...args);
        if (!response.ok) {
          const error = await response.clone().json().catch(() => ({}));
          
          // Handle specific auth errors
          if (error.code === 'session_not_found' || 
              error.code === 'invalid_refresh_token' ||
              error.code === 'session_expired' ||
              error.code === 'token_expired') {
            // Clear all auth data and reload
            localStorage.clear();
            window.location.reload();
            throw new Error('Session expired');
          }
          
          throw error;
        }
        return response;
      });
    }
  }
});

// Set up auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    // Clear all auth data and reload on sign out
    localStorage.clear();
    window.location.reload();
  } else if (event === 'TOKEN_REFRESHED') {
    // Update the session in local storage
    if (session) {
      localStorage.setItem('supabase.auth.token', JSON.stringify(session));
    }
  } else if (event === 'SIGNED_IN') {
    // Ensure we have a valid session on sign in
    if (!session) {
      localStorage.clear();
      window.location.reload();
    }
  }
});

// Initialize auth state
supabase.auth.getSession().catch(() => {
  // If getting session fails, clear storage and reload
  localStorage.clear();
  window.location.reload();
});