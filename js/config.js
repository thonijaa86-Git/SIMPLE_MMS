/**
 * Configuration & Supabase Credentials Manager
 */

const SUPABASE_CONFIG_KEY = 'mms_supabase_credentials';

const DEFAULT_SUPABASE_URL = 'https://lfxztrnxtmectdwddgno.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeHp0cm54dG1lY3Rkd2RkZ25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1OTgxNDIsImV4cCI6MjEwMjE3NDE0Mn0.ih_7BjY9a8m5b2lzjNfm6anJXQaZEHBsxiC0j61xFlk';

export function getSupabaseConfig() {
  const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.key) return parsed;
    } catch (e) {
      console.error('Failed to parse Supabase credentials', e);
    }
  }
  return {
    url: DEFAULT_SUPABASE_URL,
    key: DEFAULT_SUPABASE_KEY,
    autoSync: true
  };
}

export function saveSupabaseConfig(url, key, autoSync = true) {
  let cleanUrl = url.trim();
  if (cleanUrl.endsWith('/rest/v1/')) {
    cleanUrl = cleanUrl.replace(/\/rest\/v1\/?$/, '');
  } else if (cleanUrl.endsWith('/rest/v1')) {
    cleanUrl = cleanUrl.replace(/\/rest\/v1$/, '');
  }

  const config = {
    url: cleanUrl,
    key: key.trim(),
    autoSync
  };
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
  return config;
}

export function clearSupabaseConfig() {
  localStorage.removeItem(SUPABASE_CONFIG_KEY);
}
