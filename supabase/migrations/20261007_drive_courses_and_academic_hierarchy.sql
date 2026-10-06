-- ============================================================================
-- STUDY COMPANION: FINAL ACADEMIC HIERARCHY & DRIVE COURSES MIGRATION
-- Migration: 20261007_drive_courses_and_academic_hierarchy.sql
-- Hierarchy: Department -> Branch -> Academic Year -> Year -> Semester -> Section -> Student
-- ============================================================================

-- 1. CREATE DRIVE COURSES TABLE
CREATE TABLE IF NOT EXISTS public.drive_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  drive_id TEXT NOT NULL,
  drive_url TEXT NOT NULL,
  thumbnail_url TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  department TEXT,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  branch TEXT,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  academic_year TEXT,
  year_of_study TEXT,
  semester TEXT,
  section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  section TEXT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  subject_name TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for high performance query resolution & student authorization checks
CREATE INDEX IF NOT EXISTS idx_drive_courses_status ON public.drive_courses(status);
CREATE INDEX IF NOT EXISTS idx_drive_courses_branch ON public.drive_courses(branch);
CREATE INDEX IF NOT EXISTS idx_drive_courses_year_sem ON public.drive_courses(year_of_study, semester);
CREATE INDEX IF NOT EXISTS idx_drive_courses_targeting ON public.drive_courses(department_id, branch_id, section_id);

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.drive_courses ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES FOR DRIVE COURSES
-- Drop old policies if existing
DROP POLICY IF EXISTS "Students can view authorized published drive courses" ON public.drive_courses;
DROP POLICY IF EXISTS "Admins have full management of drive courses" ON public.drive_courses;

-- Admin Policy: Admins can do everything
CREATE POLICY "Admins have full management of drive courses"
ON public.drive_courses
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
);

-- Student Policy: Students can only view published courses targeted to their cohort or 'All'
CREATE POLICY "Students can view authorized published drive courses"
ON public.drive_courses
FOR SELECT
TO authenticated
USING (
  status = 'published'
  AND (
    -- Admins can read
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
    )
    OR
    -- Student academic matching
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND (drive_courses.department IS NULL OR drive_courses.department = 'All' OR drive_courses.department = p.department)
        AND (drive_courses.branch IS NULL OR drive_courses.branch = 'All' OR drive_courses.branch = p.branch)
        AND (drive_courses.year_of_study IS NULL OR drive_courses.year_of_study = 'All' OR drive_courses.year_of_study = p.year_of_study)
        AND (drive_courses.semester IS NULL OR drive_courses.semester = 'All' OR drive_courses.semester = p.semester)
        AND (drive_courses.section IS NULL OR drive_courses.section = 'All' OR drive_courses.section = p.section)
    )
  )
);

-- 4. SAFE REMOVAL / DEPRECATION OF SUB-BRANCH CONSTRAINTS & COLUMNS
-- Drop foreign key constraints on sub_branch_id safely if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'classes_sub_branch_id_fkey'
  ) THEN
    ALTER TABLE public.classes DROP CONSTRAINT classes_sub_branch_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'branch_codes_sub_branch_id_fkey'
  ) THEN
    ALTER TABLE public.branch_codes DROP CONSTRAINT branch_codes_sub_branch_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_sub_branch_id_fkey'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_sub_branch_id_fkey;
  END IF;
END $$;
