-- Ensure the pdfs bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdfs', 'pdfs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop any conflicting policies on storage.objects for the pdfs bucket
DROP POLICY IF EXISTS "Public access to PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow PDF uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow PDF updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow PDF deletes" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view PDF files" ON storage.objects;

-- Create explicit permissive policies for the pdfs bucket
-- Note: Security is managed at the application level (Firebase Admin check)
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'pdfs');

CREATE POLICY "Public Insert Access" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'pdfs');

CREATE POLICY "Public Update Access" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'pdfs');

CREATE POLICY "Public Delete Access" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'pdfs');
