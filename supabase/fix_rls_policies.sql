-- Run this in your Supabase SQL Editor to fix the RLS violation error
-- without having to reset your entire database.

-- Allow authenticated users to create families
CREATE POLICY "Users can create families"
ON families FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow users to create their own profile linked to a family
CREATE POLICY "Users can join a family"
ON users FOR INSERT
WITH CHECK (id = auth.uid());
