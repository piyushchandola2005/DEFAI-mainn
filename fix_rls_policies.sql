-- Fix RLS policies for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS users_full_access ON public.users;

-- Allow users to insert their own record (for wallet-based auth)
CREATE POLICY "Allow wallet-based user insertion" ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Allow users to update their own record
CREATE POLICY "Allow users to update their own record" ON public.users
  FOR UPDATE
  USING (wallet_address = lower(auth.uid()::text))
  WITH CHECK (wallet_address = lower(auth.uid()::text));

-- Allow users to read their own record
CREATE POLICY "Allow users to read their own record" ON public.users
  FOR SELECT
  USING (wallet_address = lower(auth.uid()::text));

-- Fix RLS policies for ai_usage table
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS ai_usage_full_access ON public.ai_usage;

-- Allow users to insert their own ai_usage
CREATE POLICY "Allow users to insert their own ai_usage" ON public.ai_usage
  FOR INSERT
  WITH CHECK (true);

-- Allow users to read their own ai_usage
CREATE POLICY "Allow users to read their own ai_usage" ON public.ai_usage
  FOR SELECT
  USING (user_id = auth.uid());

-- Allow users to update their own ai_usage
CREATE POLICY "Allow users to update their own ai_usage" ON public.ai_usage
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create a function to handle user registration with proper permissions
CREATE OR REPLACE FUNCTION public.handle_new_user(wallet_address text, display_name text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record jsonb;
BEGIN
  -- Insert or update user
  INSERT INTO public.users (wallet_address, display_name, last_connected_at)
  VALUES (
    wallet_address,
    COALESCE(display_name, 'User ' || substring(wallet_address from 1 for 6) || '...' || substring(wallet_address from 39)),
    now()
  )
  ON CONFLICT (wallet_address) 
  DO UPDATE SET 
    last_connected_at = now(),
    updated_at = now(),
    display_name = COALESCE(display_name, public.users.display_name)
  RETURNING to_jsonb(users.*) INTO user_record;
  
  -- Initialize AI usage if it doesn't exist
  INSERT INTO public.ai_usage (user_id, total_calls, last_used)
  SELECT (user_record->>'id')::uuid, 0, now()
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN user_record;
END;
$$;

-- Grant permission to execute the function
GRANT EXECUTE ON FUNCTION public.handle_new_user TO anon, authenticated;
