-- First, remove the insecure RLS policy from the system_state table
DROP POLICY IF EXISTS "Allow public access to update system state" ON public.system_state;

-- Create a new, more restrictive policy that only allows admins to update it directly
CREATE POLICY "Allow admins to update system state"
ON public.system_state FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));


-- Create the RPC function to handle atomic token creation
CREATE OR REPLACE FUNCTION public.create_new_token_and_increment()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  next_num int;
  new_token_record json;
BEGIN
  -- Lock the system_state table to prevent race conditions
  LOCK TABLE public.system_state IN EXCLUSIVE MODE;

  -- Get the current next_token_number
  SELECT next_token_number INTO next_num FROM public.system_state WHERE id = 1;

  -- Increment the number for the next caller
  UPDATE public.system_state SET next_token_number = next_num + 1 WHERE id = 1;

  -- Insert the new token with the reserved number
  INSERT INTO public.tokens (number, status)
  VALUES (next_num, 'waiting')
  RETURNING json_build_object(
    'id', id,
    'number', number,
    'status', status,
    'created_at', created_at,
    'updated_at', updated_at,
    'served_at', served_at,
    'served_by_counter_id', served_by_counter_id
  ) INTO new_token_record;

  RETURN new_token_record;
END;
$$;