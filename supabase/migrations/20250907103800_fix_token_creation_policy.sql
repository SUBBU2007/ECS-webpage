-- Drop the old, incorrect policy that required authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to create tokens" ON public.tokens;

-- Create a new policy to allow any user (including anonymous) to create tokens.
-- The `public` role includes `anon` (unauthenticated users) and `authenticated` users.
CREATE POLICY "Allow public access to create tokens"
ON public.tokens FOR INSERT
TO public
WITH CHECK (true);
