-- Function to create a family and link the creator in one transaction
-- This bypasses the RLS "chicken and egg" problem where you can't see the family
-- you just created because you aren't linked to it yet.

CREATE OR REPLACE FUNCTION create_new_family(family_name TEXT, user_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Run as database owner (bypasses RLS)
SET search_path = public
AS $$
DECLARE
  new_family_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current auth user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Create Family
  INSERT INTO families (name)
  VALUES (family_name)
  RETURNING id INTO new_family_id;

  -- 2. Link User to Family as Admin
  INSERT INTO users (id, family_id, name, role)
  VALUES (current_user_id, new_family_id, user_name, 'admin');

  RETURN new_family_id;
END;
$$;
