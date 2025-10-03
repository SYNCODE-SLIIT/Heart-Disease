-- ============================================
-- Supabase Avatar Bucket Setup
-- ============================================
-- Run this SQL in your Supabase SQL Editor to ensure
-- the avatars bucket is properly configured
-- ============================================

-- 1. Create the avatars bucket (if it doesn't exist)
-- This will store user profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Set up RLS (Row Level Security) policies for avatars bucket

-- Policy: Allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access to all avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy: Allow users to update/replace their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify the setup:

-- Check if bucket exists and is public
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'avatars';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects' AND policyname LIKE '%avatar%';

-- ============================================
-- Notes:
-- ============================================
-- 1. Make sure to run this in your Supabase SQL Editor
-- 2. The bucket is set to PUBLIC so avatar images can be viewed by anyone
-- 3. Users can only upload/modify/delete files in their own folder (user_id/)
-- 4. If you get "policy already exists" errors, that's fine - they're already set up
