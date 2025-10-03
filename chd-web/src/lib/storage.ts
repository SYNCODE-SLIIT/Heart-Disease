import { supabase } from './supabaseClient';
import type { User } from '@supabase/supabase-js';

export const STORAGE_BUCKET = 'heartsense-data';

function assertSupabaseConfigured() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
}

export function buildUserCsvPath(user: User, filenameHint: string) {
  const safeHint = filenameHint.replace(/[^a-zA-Z0-9-_\.]/g, '_').slice(0, 64) || 'data';
  const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  return `${user.id}/${ts}_${safeHint}.csv`;
}

export async function uploadUserCSV(user: User, csvText: string, filenameHint = 'heartsense'): Promise<{ path: string }>{
  assertSupabaseConfigured();
  const path = buildUserCsvPath(user, filenameHint);
  const { error } = await supabase!.storage
    .from(STORAGE_BUCKET)
    .upload(path, new Blob([csvText], { type: 'text/csv;charset=utf-8' }), {
      cacheControl: '3600',
      upsert: false,
      contentType: 'text/csv',
    });
  if (error) throw error;
  return { path };
}

export interface UserCsvObject {
  name: string; // file name within the prefix
  id?: string;  // optional id returned by supabase
  created_at?: string;
  updated_at?: string;
  path: string; // full path userId/filename
  size?: number;
}

export async function listUserCSVs(user: User): Promise<UserCsvObject[]> {
  assertSupabaseConfigured();
  const prefix = `${user.id}/`;
  const { data, error } = await supabase!.storage
    .from(STORAGE_BUCKET)
    .list(prefix, { limit: 100, sortBy: { column: 'updated_at', order: 'desc' } });
  if (error) throw error;
  const rows = (data || [])
    .filter((o) => o.name?.toLowerCase().endsWith('.csv'))
    .map((o) => ({ ...o, path: prefix + o.name }));
  return rows as UserCsvObject[];
}

export async function downloadCSV(path: string): Promise<string> {
  assertSupabaseConfigured();
  const { data, error } = await supabase!.storage.from(STORAGE_BUCKET).download(path);
  if (error) throw error;
  const text = await data.text();
  return text;
}
