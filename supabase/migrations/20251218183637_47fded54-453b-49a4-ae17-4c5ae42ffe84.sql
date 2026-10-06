-- Create PDFs table
CREATE TABLE public.pdfs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  file_url TEXT NOT NULL,
  file_size TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploader_name TEXT NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pdfs ENABLE ROW LEVEL SECURITY;

-- Everyone can view PDFs
CREATE POLICY "Anyone can view PDFs" 
ON public.pdfs 
FOR SELECT 
USING (true);

-- Only admins can insert PDFs
CREATE POLICY "Admins can insert PDFs" 
ON public.pdfs 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update PDFs
CREATE POLICY "Admins can update PDFs" 
ON public.pdfs 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete PDFs
CREATE POLICY "Admins can delete PDFs" 
ON public.pdfs 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_pdfs_updated_at
BEFORE UPDATE ON public.pdfs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('pdfs', 'pdfs', true);

-- Storage policies for PDFs bucket
CREATE POLICY "Anyone can view PDF files"
ON storage.objects FOR SELECT
USING (bucket_id = 'pdfs');

CREATE POLICY "Admins can upload PDF files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pdfs' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update PDF files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'pdfs' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete PDF files"
ON storage.objects FOR DELETE
USING (bucket_id = 'pdfs' AND has_role(auth.uid(), 'admin'::app_role));