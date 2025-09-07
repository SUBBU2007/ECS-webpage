-- Create an ENUM type for token status
CREATE TYPE public.token_status AS ENUM ('waiting', 'serving', 'served', 'skipped');

-- Create the tokens table
CREATE TABLE public.tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number INT NOT NULL,
    status token_status NOT NULL DEFAULT 'waiting',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    served_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add a trigger to the tokens table to automatically update updated_at
CREATE TRIGGER update_tokens_updated_at
BEFORE UPDATE ON public.tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS for the tokens table
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for the tokens table
CREATE POLICY "Allow public read-only access to tokens"
ON public.tokens FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated users to create tokens"
ON public.tokens FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow admins to update tokens"
ON public.tokens FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Allow admins to delete tokens"
ON public.tokens FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));


-- Create the system_state table
CREATE TABLE public.system_state (
    id INT PRIMARY KEY CHECK (id = 1), -- Enforce a single row
    current_serving_number INT,
    next_token_number INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add a trigger to the system_state table to automatically update updated_at
CREATE TRIGGER update_system_state_updated_at
BEFORE UPDATE ON public.system_state
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS for the system_state table
ALTER TABLE public.system_state ENABLE ROW LEVEL SECURITY;

-- Create policies for the system_state table
CREATE POLICY "Allow public read-only access to system state"
ON public.system_state FOR SELECT
USING (true);

CREATE POLICY "Allow admins to update system state"
ON public.system_state FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert the initial singleton row into system_state
INSERT INTO public.system_state (id, current_serving_number, next_token_number)
VALUES (1, NULL, 1);
