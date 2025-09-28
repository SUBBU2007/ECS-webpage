-- Create the counters table to store service counters
CREATE TABLE public.counters (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create an ENUM type for token status
CREATE TYPE public.token_status AS ENUM ('waiting', 'serving', 'served', 'skipped');

-- Create the tokens table
CREATE TABLE public.tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number INT NOT NULL,
    status token_status NOT NULL DEFAULT 'waiting',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    served_at TIMESTAMPTZ,
    served_by_counter_id INT REFERENCES public.counters(id) ON DELETE SET NULL
);

-- Create a function to automatically update the updated_at timestamp
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

-- Create the system_state table for global values
CREATE TABLE public.system_state (
    id INT PRIMARY KEY CHECK (id = 1), -- Enforce a single row
    next_token_number INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add a trigger to the system_state table
CREATE TRIGGER update_system_state_updated_at
BEFORE UPDATE ON public.system_state
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the initial singleton row into system_state
INSERT INTO public.system_state (id, next_token_number) VALUES (1, 1);

-- RLS POLICIES --

-- Enable RLS for all new tables
ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_state ENABLE ROW LEVEL SECURITY;

-- Policies for 'counters' table
CREATE POLICY "Allow public read-only access to counters"
ON public.counters FOR SELECT USING (true);

CREATE POLICY "Allow admins to manage counters"
ON public.counters FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policies for 'tokens' table
CREATE POLICY "Allow public read-only access to tokens"
ON public.tokens FOR SELECT USING (true);

CREATE POLICY "Allow public access to create tokens"
ON public.tokens FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow admins to update tokens"
ON public.tokens FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Allow admins to delete tokens"
ON public.tokens FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Policies for 'system_state' table
CREATE POLICY "Allow public read-only access to system state"
ON public.system_state FOR SELECT USING (true);

CREATE POLICY "Allow public access to update system state"
ON public.system_state FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Add some default counters to start with
INSERT INTO public.counters (name) VALUES ('Counter 1'), ('Counter 2');