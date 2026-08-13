/**
 * Configuration & Supabase Credentials Manager
 */

const SUPABASE_CONFIG_KEY = 'mms_supabase_credentials';

export function getSupabaseConfig() {
  const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse Supabase credentials', e);
    }
  }
  return {
    url: '',
    key: '',
    autoSync: true
  };
}

export function saveSupabaseConfig(url, key, autoSync = true) {
  const config = {
    url: url.trim(),
    key: key.trim(),
    autoSync
  };
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
  return config;
}

export function clearSupabaseConfig() {
  localStorage.removeItem(SUPABASE_CONFIG_KEY);
}
