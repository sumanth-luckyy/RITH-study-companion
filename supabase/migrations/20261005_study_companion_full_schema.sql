-- Study Companion: Comprehensive Academic Schema Migration

-- 1. Extend profiles table with complete academic identity
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'CSE',
ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2025-2026',
ADD COLUMN IF NOT EXISTS year_of_study TEXT DEFAULT '1st Year',
ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'A',
ADD COLUMN IF NOT EXISTS semester TEXT DEFAULT 'Semester 1',
ADD COLUMN IF NOT EXISTS class_group TEXT DEFAULT '25CS-A',
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Create Subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  faculty TEXT NOT NULL,
  faculty_email TEXT,
  department TEXT NOT NULL DEFAULT 'Computer Science & Engineering',
  branch TEXT NOT NULL DEFAULT 'CSE',
  semester TEXT NOT NULL DEFAULT 'Semester 1',
  credits INTEGER NOT NULL DEFAULT 4,
  syllabus JSONB DEFAULT '[]'::jsonb,
  color TEXT DEFAULT 'hsl(238, 55%, 50%)',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subjects" 
ON public.subjects FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage subjects" 
ON public.subjects FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Create Timetable table
CREATE TABLE IF NOT EXISTS public.timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_group TEXT NOT NULL,
  day TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  faculty TEXT NOT NULL,
  room TEXT NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'Lecture',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view timetable" 
ON public.timetable FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage timetable" 
ON public.timetable FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Create Assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_group TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_marks INTEGER DEFAULT 100,
  attachment_url TEXT,
  attachment_name TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view assignments" 
ON public.assignments FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage assignments" 
ON public.assignments FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. Create Student Assignment Progress table
CREATE TABLE IF NOT EXISTS public.student_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, assignment_id)
);

ALTER TABLE public.student_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own assignment status" 
ON public.student_assignments FOR ALL 
USING (auth.uid() = user_id);

-- 6. Create Announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  priority TEXT NOT NULL DEFAULT 'normal',
  class_group TEXT,
  author TEXT NOT NULL DEFAULT 'Academic Office',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view announcements" 
ON public.announcements FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage announcements" 
ON public.announcements FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 7. Create Announcement Read State
CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, announcement_id)
);

ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own announcement read status" 
ON public.announcement_reads FOR ALL 
USING (auth.uid() = user_id);

-- 8. Enhance Resources / PDFs table
ALTER TABLE public.pdfs 
ADD COLUMN IF NOT EXISTS unit_or_topic TEXT DEFAULT 'General',
ADD COLUMN IF NOT EXISTS class_group TEXT,
ADD COLUMN IF NOT EXISTS semester TEXT DEFAULT 'Semester 1',
ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'PDF',
ADD COLUMN IF NOT EXISTS subject_name TEXT,
ADD COLUMN IF NOT EXISTS exam_year TEXT,
ADD COLUMN IF NOT EXISTS exam_type TEXT,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- 9. Create Resource Bookmarks table
CREATE TABLE IF NOT EXISTS public.resource_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resource_id UUID REFERENCES public.pdfs(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, resource_id)
);

ALTER TABLE public.resource_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bookmarks" 
ON public.resource_bookmarks FOR ALL 
USING (auth.uid() = user_id);

-- 10. Create Ratings table
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  category TEXT DEFAULT 'General',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert ratings" 
ON public.ratings FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view ratings" 
ON public.ratings FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 11. Create Activity Logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  performed_by TEXT NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view activity logs" 
ON public.activity_logs FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert activity logs" 
ON public.activity_logs FOR INSERT 
WITH CHECK (true);

