-- Drop the old, incorrect policy that required authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to create tokens" ON public.tokens;

-- Create a new policy to allow any user (including anonymous) to create tokens.
CREATE POLICY "Allow public access to create tokens"
ON public.tokens FOR INSERT
TO public
WITH CHECK (true);

-- Drop the old, incorrect policy that required admin users to update system state
DROP POLICY IF EXISTS "Allow admins to update system state" ON public.system_state;

-- Create a new policy to allow any user to update the system state.
-- This is necessary so that getting a token can also increment the next_token_number.
CREATE POLICY "Allow public access to update system state"
ON public.system_state FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
