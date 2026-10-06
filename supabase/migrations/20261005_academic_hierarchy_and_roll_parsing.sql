-- Study Companion: Academic Hierarchy, Roll Number Parsing & Admin Access Control
-- Migration: 20261005_academic_hierarchy_and_roll_parsing.sql

-- ============================================================================
-- 1. ACADEMIC HIERARCHY TABLES
-- ============================================================================

-- 1.1 Departments
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active departments"
ON public.departments FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage departments"
ON public.departments FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 1.2 Branches
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(department_id, code)
);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active branches"
ON public.branches FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage branches"
ON public.branches FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 1.3 Sub-Branches (Specializations)
CREATE TABLE IF NOT EXISTS public.sub_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(branch_id, code)
);

ALTER TABLE public.sub_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sub-branches"
ON public.sub_branches FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage sub-branches"
ON public.sub_branches FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 1.4 Academic Years
CREATE TABLE IF NOT EXISTS public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  start_year INTEGER NOT NULL,
  end_year INTEGER NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view academic years"
ON public.academic_years FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage academic years"
ON public.academic_years FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 1.5 Academic Classes
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  sub_branch_id UUID REFERENCES public.sub_branches(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  year_of_study TEXT NOT NULL DEFAULT '1st Year',
  semester TEXT NOT NULL DEFAULT 'Semester 1',
  code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view classes"
ON public.classes FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage classes"
ON public.classes FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 1.6 Sections
CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  capacity INTEGER DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, code)
);

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sections"
ON public.sections FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage sections"
ON public.sections FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- 2. CONFIGURABLE ROLL NUMBER PARSING & MAPPING
-- ============================================================================

-- 2.1 Branch Codes Mapping Table
CREATE TABLE IF NOT EXISTS public.branch_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  sub_branch_id UUID REFERENCES public.sub_branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.branch_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active branch codes"
ON public.branch_codes FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage branch codes"
ON public.branch_codes FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2.2 Roll Number Format Configuration
CREATE TABLE IF NOT EXISTS public.roll_number_formats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  pattern TEXT NOT NULL,
  year_group_index INTEGER NOT NULL DEFAULT 1,
  college_group_index INTEGER NOT NULL DEFAULT 2,
  branch_code_group_index INTEGER NOT NULL DEFAULT 3,
  roll_group_index INTEGER NOT NULL DEFAULT 4,
  century_prefix INTEGER NOT NULL DEFAULT 2000,
  sample_roll TEXT NOT NULL DEFAULT '25ME1A4602',
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.roll_number_formats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view roll number formats"
ON public.roll_number_formats FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage roll number formats"
ON public.roll_number_formats FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- 3. ADMIN AUDIT LOGGING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_name TEXT NOT NULL DEFAULT 'Admin',
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs"
ON public.admin_audit_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users or system can insert audit logs"
ON public.admin_audit_logs FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- 4. EXTEND PROFILES & ACADEMIC ENTITIES WITH RELATIONAL FOREIGN KEYS
-- ============================================================================

-- Profiles table extensions
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS sub_branch TEXT DEFAULT 'Core',
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sub_branch_id UUID REFERENCES public.sub_branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS joining_year INTEGER,
ADD COLUMN IF NOT EXISTS college_code TEXT,
ADD COLUMN IF NOT EXISTS branch_code TEXT,
ADD COLUMN IF NOT EXISTS numeric_roll TEXT;

-- Enhance PDFs (Resources) for academic targeting
ALTER TABLE public.pdfs
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sub_branch_id UUID REFERENCES public.sub_branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sub_branch TEXT;

-- Enhance Assignments for academic targeting
ALTER TABLE public.assignments
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sub_branch_id UUID REFERENCES public.sub_branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sub_branch TEXT,
ADD COLUMN IF NOT EXISTS section TEXT;

-- Enhance Timetable for academic targeting
ALTER TABLE public.timetable
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sub_branch_id UUID REFERENCES public.sub_branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS section TEXT;

-- Enhance Announcements for academic targeting
ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS target_type TEXT NOT NULL DEFAULT 'all',
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sub_branch_id UUID REFERENCES public.sub_branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS section TEXT;

-- ============================================================================
-- 5. INITIAL SEEDS (DEPARTMENTS, BRANCHES, SUB-BRANCHES, YEARS, CODES)
-- ============================================================================

DO $$
DECLARE
  dept_eng UUID;
  branch_cse UUID;
  branch_ece UUID;
  sub_cse_core UUID;
  sub_cse_cs UUID;
  sub_cse_ds UUID;
  sub_cse_aiml UUID;
  sub_ece_core UUID;
  sub_ece_vlsi UUID;
  ay_2026 UUID;
  ay_2025 UUID;
  cls_cyber UUID;
  sec_cyber_a UUID;
BEGIN
  -- Insert Department
  INSERT INTO public.departments (name, code, description)
  VALUES ('Engineering & Technology', 'ENG', 'Faculty of Engineering and Technology')
  ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO dept_eng;

  -- Insert Branches
  INSERT INTO public.branches (department_id, name, code, description)
  VALUES (dept_eng, 'Computer Science & Engineering', 'CSE', 'Department of CSE')
  ON CONFLICT (department_id, code) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO branch_cse;

  INSERT INTO public.branches (department_id, name, code, description)
  VALUES (dept_eng, 'Electronics & Communication Engineering', 'ECE', 'Department of ECE')
  ON CONFLICT (department_id, code) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO branch_ece;

  -- Insert Sub-Branches for CSE
  INSERT INTO public.sub_branches (branch_id, name, code, description)
  VALUES (branch_cse, 'Core Computer Science', 'CORE', 'Traditional Computer Science & Engineering')
  ON CONFLICT (branch_id, code) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO sub_cse_core;

  INSERT INTO public.sub_branches (branch_id, name, code, description)
  VALUES (branch_cse, 'Cyber Security', 'CS', 'Specialization in Cyber Security and Digital Forensics')
  ON CONFLICT (branch_id, code) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO sub_cse_cs;

  INSERT INTO public.sub_branches (branch_id, name, code, description)
  VALUES (branch_cse, 'Data Science', 'DS', 'Specialization in Big Data, Analytics and Machine Learning')
  ON CONFLICT (branch_id, code) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO sub_cse_ds;

  INSERT INTO public.sub_branches (branch_id, name, code, description)
  VALUES (branch_cse, 'Artificial Intelligence & Machine Learning', 'AIML', 'Specialization in AI & Deep Learning')
  ON CONFLICT (branch_id, code) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO sub_cse_aiml;

  -- Insert Sub-Branches for ECE
  INSERT INTO public.sub_branches (branch_id, name, code, description)
  VALUES (branch_ece, 'Core Electronics', 'CORE', 'Core Electronics & Communication')
  ON CONFLICT (branch_id, code) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO sub_ece_core;

  INSERT INTO public.sub_branches (branch_id, name, code, description)
  VALUES (branch_ece, 'VLSI Design', 'VLSI', 'Very Large Scale Integration Design')
  ON CONFLICT (branch_id, code) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO sub_ece_vlsi;

  -- Insert Academic Years
  INSERT INTO public.academic_years (name, start_year, end_year, is_current)
  VALUES ('2026–27', 2026, 2027, true)
  ON CONFLICT (name) DO UPDATE SET is_current = EXCLUDED.is_current
  RETURNING id INTO ay_2026;

  INSERT INTO public.academic_years (name, start_year, end_year, is_current)
  VALUES ('2025–26', 2025, 2026, false)
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO ay_2025;

  -- Insert Class
  INSERT INTO public.classes (department_id, branch_id, sub_branch_id, academic_year_id, name, year_of_study, semester, code)
  VALUES (dept_eng, branch_cse, sub_cse_cs, ay_2026, 'B.Tech CSE - Cyber Security (2026-27)', '1st Year', 'Semester 1', '26CSE-CS-1')
  ON CONFLICT DO NOTHING
  RETURNING id INTO cls_cyber;

  IF cls_cyber IS NOT NULL THEN
    INSERT INTO public.sections (class_id, name, code)
    VALUES 
      (cls_cyber, 'Section A', 'A'),
      (cls_cyber, 'Section B', 'B')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Insert Configurable Branch Code Mappings
  -- Format 25ME1A4602 -> 1A maps to Cyber Security!
  INSERT INTO public.branch_codes (code, branch_id, sub_branch_id, name, description)
  VALUES 
    ('1A', branch_cse, sub_cse_cs, 'Computer Science & Engineering (Cyber Security)', 'Institutional code for CSE Cyber Security specialization'),
    ('05', branch_cse, sub_cse_core, 'Computer Science & Engineering (Core)', 'Institutional code for CSE Core branch'),
    ('42', branch_cse, sub_cse_aiml, 'Computer Science & Engineering (AI & ML)', 'Institutional code for CSE AI & ML'),
    ('44', branch_cse, sub_cse_ds, 'Computer Science & Engineering (Data Science)', 'Institutional code for CSE Data Science'),
    ('04', branch_ece, sub_ece_core, 'Electronics & Communication Engineering', 'Institutional code for ECE Core'),
    ('CS', branch_cse, sub_cse_core, 'Computer Science (Standard prefix)', 'Standard prefix fallback mapping')
  ON CONFLICT (code) DO UPDATE SET 
    branch_id = EXCLUDED.branch_id, 
    sub_branch_id = EXCLUDED.sub_branch_id, 
    name = EXCLUDED.name;

  -- Insert Configurable Roll Number Formats
  INSERT INTO public.roll_number_formats (
    name, 
    pattern, 
    year_group_index, 
    college_group_index, 
    branch_code_group_index, 
    roll_group_index, 
    century_prefix, 
    sample_roll, 
    description, 
    is_default
  )
  VALUES (
    'Institutional 10-Character (e.g. 25ME1A4602)',
    '^(\\d{2})([A-Z]{2})([A-Z0-9]{2})(\\d{4})$',
    1,
    2,
    3,
    4,
    2000,
    '25ME1A4602',
    'Matches standard college format: 25 (joining year) + ME (college code) + 1A (branch code) + 4602 (numeric roll)',
    true
  )
  ON CONFLICT DO NOTHING;

  INSERT INTO public.roll_number_formats (
    name, 
    pattern, 
    year_group_index, 
    college_group_index, 
    branch_code_group_index, 
    roll_group_index, 
    century_prefix, 
    sample_roll, 
    description, 
    is_default
  )
  VALUES (
    'Alternative Direct Prefix (e.g. 25CS042)',
    '^(\\d{2})([A-Z]{2,4})(\\d{3,4})$',
    1,
    0, -- no college code in this pattern
    2,
    3,
    2000,
    '25CS042',
    'Matches legacy / alternative format: 25 (joining year) + CS (branch code) + 042 (roll number)',
    false
  )
  ON CONFLICT DO NOTHING;
END $$;
