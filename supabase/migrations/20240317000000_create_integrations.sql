-- Create integrations table
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    credentials JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    connected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read only their own integrations
CREATE POLICY "Users can view own integrations" ON public.integrations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy to allow users to insert their own integrations
CREATE POLICY "Users can insert own integrations" ON public.integrations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own integrations
CREATE POLICY "Users can update own integrations" ON public.integrations
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own integrations
CREATE POLICY "Users can delete own integrations" ON public.integrations
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER handle_integrations_updated_at
    BEFORE UPDATE ON public.integrations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 