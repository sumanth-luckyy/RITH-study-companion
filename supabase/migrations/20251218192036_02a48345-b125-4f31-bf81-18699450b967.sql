-- Drop all existing pdfs table policies and recreate
DROP POLICY IF EXISTS "Admins can delete PDFs" ON public.pdfs;
DROP POLICY IF EXISTS "Admins can insert PDFs" ON public.pdfs;
DROP POLICY IF EXISTS "Admins can update PDFs" ON public.pdfs;
DROP POLICY IF EXISTS "Anyone can view PDFs" ON public.pdfs;
DROP POLICY IF EXISTS "Allow PDF insert" ON public.pdfs;
DROP POLICY IF EXISTS "Allow PDF update" ON public.pdfs;
DROP POLICY IF EXISTS "Allow PDF delete" ON public.pdfs;

-- Create new permissive policies (app handles auth via Firebase)
CREATE POLICY "Public read PDFs" 
ON public.pdfs 
FOR SELECT 
USING (true);

CREATE POLICY "Public insert PDFs" 
ON public.pdfs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public update PDFs" 
ON public.pdfs 
FOR UPDATE 
USING (true);

CREATE POLICY "Public delete PDFs" 
ON public.pdfs 
FOR DELETE 
USING (true);