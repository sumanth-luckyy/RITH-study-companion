-- Study Companion: Real User Management, Server-Side Role Security & Audit Logs Migration

-- 1. Ensure status column on profiles with active/inactive/suspended
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT,
  action TEXT NOT NULL,
  target_user_id UUID,
  target_user_email TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_logs FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Secure Function: Set User Status (Active, Inactive, Suspended)
CREATE OR REPLACE FUNCTION public.admin_set_user_status(
  _target_user_id UUID,
  _new_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_id UUID;
  caller_email TEXT;
  target_role TEXT;
  target_email TEXT;
  active_admin_count INT;
BEGIN
  caller_id := auth.uid();

  -- Verify caller is admin
  IF NOT public.has_role(caller_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can modify user status.';
  END IF;

  -- Validate new status
  IF _new_status NOT IN ('active', 'inactive', 'suspended') THEN
    RAISE EXCEPTION 'Invalid status. Must be active, inactive, or suspended.';
  END IF;

  -- Prevent admin from deactivating/suspending their own account
  IF _target_user_id = caller_id AND _new_status <> 'active' THEN
    RAISE EXCEPTION 'You cannot deactivate or suspend your own administrator account.';
  END IF;

  -- Get target profile details
  SELECT role, email INTO target_role, target_email
  FROM public.profiles
  WHERE user_id = _target_user_id;

  IF target_role IS NULL THEN
    RAISE EXCEPTION 'User not found in profiles.';
  END IF;

  -- If target is an admin and being deactivated/suspended, verify at least 1 other active admin remains
  IF target_role = 'admin' AND _new_status <> 'active' THEN
    SELECT COUNT(*) INTO active_admin_count
    FROM public.profiles
    WHERE role = 'admin'
      AND status = 'active'
      AND user_id <> _target_user_id;

    IF active_admin_count < 1 THEN
      RAISE EXCEPTION 'Action rejected: At least one active administrator must remain.';
    END IF;
  END IF;

  -- Update target profile
  UPDATE public.profiles
  SET
    status = _new_status,
    is_active = (_new_status = 'active'),
    updated_at = now()
  WHERE user_id = _target_user_id;

  -- Fetch caller email
  SELECT email INTO caller_email FROM auth.users WHERE id = caller_id;

  -- Record audit log
  INSERT INTO public.admin_audit_logs (
    admin_id,
    admin_email,
    action,
    target_user_id,
    target_user_email,
    details
  ) VALUES (
    caller_id,
    caller_email,
    'SET_USER_STATUS',
    _target_user_id,
    target_email,
    jsonb_build_object('new_status', _new_status, 'previous_role', target_role)
  );

  RETURN jsonb_build_object(
    'success', true,
    'target_user_id', _target_user_id,
    'status', _new_status
  );
END;
$$;

-- 4. Secure Function: Delete User (with self and last-admin protection)
CREATE OR REPLACE FUNCTION public.admin_delete_user(
  _target_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_id UUID;
  caller_email TEXT;
  target_role TEXT;
  target_email TEXT;
  active_admin_count INT;
BEGIN
  caller_id := auth.uid();

  -- Verify caller is admin
  IF NOT public.has_role(caller_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can delete users.';
  END IF;

  -- Prevent admin from deleting their own account
  IF _target_user_id = caller_id THEN
    RAISE EXCEPTION 'You cannot delete your own account.';
  END IF;

  -- Get target profile details
  SELECT role, email INTO target_role, target_email
  FROM public.profiles
  WHERE user_id = _target_user_id;

  -- If target is admin, ensure at least one active admin remains
  IF target_role = 'admin' THEN
    SELECT COUNT(*) INTO active_admin_count
    FROM public.profiles
    WHERE role = 'admin'
      AND status = 'active'
      AND user_id <> _target_user_id;

    IF active_admin_count < 1 THEN
      RAISE EXCEPTION 'Action rejected: At least one active administrator must remain.';
    END IF;
  END IF;

  -- Clean up user dependent rows
  DELETE FROM public.resource_bookmarks WHERE user_id = _target_user_id;
  DELETE FROM public.student_assignments WHERE user_id = _target_user_id;
  DELETE FROM public.announcement_reads WHERE user_id = _target_user_id;
  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
  DELETE FROM public.profiles WHERE user_id = _target_user_id;

  -- Delete from auth.users if available
  BEGIN
    DELETE FROM auth.users WHERE id = _target_user_id;
  EXCEPTION WHEN OTHERS THEN
    -- If foreign key or permission restriction in auth schema, profile deletion suffices
    NULL;
  END;

  -- Fetch caller email
  SELECT email INTO caller_email FROM auth.users WHERE id = caller_id;

  -- Record audit log
  INSERT INTO public.admin_audit_logs (
    admin_id,
    admin_email,
    action,
    target_user_id,
    target_user_email,
    details
  ) VALUES (
    caller_id,
    caller_email,
    'DELETE_USER',
    _target_user_id,
    target_email,
    jsonb_build_object('deleted_role', target_role)
  );

  RETURN jsonb_build_object(
    'success', true,
    'target_user_id', _target_user_id
  );
END;
$$;

-- 5. Secure Function: Update User Role (with self and last-admin protection)
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  _target_user_id UUID,
  _new_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_id UUID;
  caller_email TEXT;
  target_current_role TEXT;
  target_email TEXT;
  active_admin_count INT;
BEGIN
  caller_id := auth.uid();

  -- Verify caller is admin
  IF NOT public.has_role(caller_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can modify roles.';
  END IF;

  IF _new_role NOT IN ('admin', 'student') THEN
    RAISE EXCEPTION 'Invalid role. Role must be admin or student.';
  END IF;

  -- Prevent modifying own role
  IF _target_user_id = caller_id THEN
    RAISE EXCEPTION 'You cannot modify your own administrator role.';
  END IF;

  SELECT role, email INTO target_current_role, target_email
  FROM public.profiles
  WHERE user_id = _target_user_id;

  -- If demoting admin to student, check remaining active admins
  IF target_current_role = 'admin' AND _new_role = 'student' THEN
    SELECT COUNT(*) INTO active_admin_count
    FROM public.profiles
    WHERE role = 'admin'
      AND status = 'active'
      AND user_id <> _target_user_id;

    IF active_admin_count < 1 THEN
      RAISE EXCEPTION 'Action rejected: At least one active administrator must remain.';
    END IF;
  END IF;

  -- Update profiles
  UPDATE public.profiles
  SET role = _new_role, updated_at = now()
  WHERE user_id = _target_user_id;

  -- Update or insert user_roles
  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, _new_role::app_role);

  -- Fetch caller email
  SELECT email INTO caller_email FROM auth.users WHERE id = caller_id;

  -- Record audit log
  INSERT INTO public.admin_audit_logs (
    admin_id,
    admin_email,
    action,
    target_user_id,
    target_user_email,
    details
  ) VALUES (
    caller_id,
    caller_email,
    'UPDATE_ROLE',
    _target_user_id,
    target_email,
    jsonb_build_object('old_role', target_current_role, 'new_role', _new_role)
  );

  RETURN jsonb_build_object(
    'success', true,
    'target_user_id', _target_user_id,
    'new_role', _new_role
  );
END;
$$;
