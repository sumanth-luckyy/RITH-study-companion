-- Drop existing restrictive policies for storage
DROP POLICY IF EXISTS "Admins can upload PDF files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update PDF files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete PDF files" ON storage.objects;

-- Create new policies that allow public access for the pdfs bucket
-- (Access control is handled at the application level via Firebase auth)
CREATE POLICY "Allow PDF uploads" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pdfs');

CREATE POLICY "Allow PDF updates" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'pdfs');

CREATE POLICY "Allow PDF deletes" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'pdfs');

-- Drop and recreate pdfs table policies
DROP POLICY IF EXISTS "Admins can insert PDFs" ON public.pdfs;
DROP POLICY IF EXISTS "Admins can update PDFs" ON public.pdfs;
DROP POLICY IF EXISTS "Admins can delete PDFs" ON public.pdfs;

-- Allow insert/update/delete for the pdfs table
-- (Access control is handled at the application level via Firebase auth)
CREATE POLICY "Allow PDF insert" 
ON public.pdfs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow PDF update" 
ON public.pdfs 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow PDF delete" 
ON public.pdfs 
FOR DELETE 
USING (true);