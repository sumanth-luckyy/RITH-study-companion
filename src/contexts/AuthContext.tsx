import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole, UserStatus, deriveClassGroup } from '@/types/academic';
import { parseRollNumber } from '@/lib/rollNumberParser';

interface AuthContextType {
  user: { id: string; email?: string } | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (identifier: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    metadata: {
      roll_number: string;
      full_name: string;
      branch?: string;
      department?: string;
      section?: string;
      semester?: string;
      academic_year?: string;
    }
  ) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const ADMIN_EMAILS = ['sumanth.akkivarapu@gmail.com'];

export function isSystemAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfileFromSupabase = useCallback(async (userId: string, emailFallback?: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        const p = data as unknown as Record<string, unknown>;
        const email = (p.email as string) || emailFallback || '';
        const role = isSystemAdminEmail(email) ? 'admin' : ((p.role as UserRole) || 'student');
        const status = (p.status as UserStatus) || (p.is_active === false ? 'inactive' : 'active');
        return {
          id: (p.id as string) || userId,
          user_id: userId,
          email,
          roll_number: (p.roll_number as string) || (isSystemAdminEmail(email) ? 'ADMIN-01' : 'N/A'),
          full_name: (p.full_name as string) || (isSystemAdminEmail(email) ? 'Sumanth (Admin)' : 'Student'),
          department: (p.department as string) || 'Computer Science & Engineering',
          branch: (p.branch as string) || 'CSE',
          sub_branch: (p.sub_branch as string) || undefined,
          academic_year: (p.academic_year as string) || '2025-2026',
          year_of_study: (p.year_of_study as string) || '1st Year',
          section: (p.section as string) || 'A',
          semester: (p.semester as string) || 'Semester 1',
          class_group: (p.class_group as string) || deriveClassGroup((p.roll_number as string) || '', (p.branch as string) || 'CSE', (p.section as string) || 'A'),
          role,
          avatar_url: p.avatar_url as string | undefined,
          is_active: status === 'active',
          status,
          department_id: (p.department_id as string) || undefined,
          branch_id: (p.branch_id as string) || undefined,
          sub_branch_id: (p.sub_branch_id as string) || undefined,
          class_id: (p.class_id as string) || undefined,
          section_id: (p.section_id as string) || undefined,
          academic_year_id: (p.academic_year_id as string) || undefined,
          joining_year: p.joining_year as number | undefined,
          college_code: p.college_code as string | undefined,
          branch_code: p.branch_code as string | undefined,
          numeric_roll: p.numeric_roll as string | undefined,
          created_at: (p.created_at as string) || new Date().toISOString(),
        };
      }
    } catch (e) {
      console.error('Error fetching profile from Supabase:', e);
    }
    return null;
  }, []);

  const createProfileIfMissing = useCallback(async (
    userId: string,
    email: string,
    metadata?: Record<string, unknown>
  ): Promise<UserProfile> => {
    const isSuperAdmin = isSystemAdminEmail(email);
    const fullName = (metadata?.full_name as string) || (isSuperAdmin ? 'Sumanth' : (email.split('@')[0] || 'Student'));
    const rollNumber = (metadata?.roll_number as string) || (isSuperAdmin ? 'ADMIN-01' : `25CS${userId.slice(0, 3).toUpperCase()}`);
    const branch = (metadata?.branch as string) || 'CSE';
    const section = (metadata?.section as string) || 'A';
    const semester = (metadata?.semester as string) || 'Semester 1';
    const academicYear = (metadata?.academic_year as string) || '2025-2026';
    const department = (metadata?.department as string) || (isSuperAdmin ? 'Administration' : `${branch} Department`);
    const role: UserRole = isSuperAdmin ? 'admin' : 'student';
    const classGroup = deriveClassGroup(rollNumber, branch, section);

    const newProfile: UserProfile = {
      id: userId,
      user_id: userId,
      email,
      roll_number: rollNumber,
      full_name: fullName,
      department,
      branch,
      academic_year: academicYear,
      year_of_study: '1st Year',
      section,
      semester,
      class_group: classGroup,
      role,
      is_active: true,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('profiles').upsert({
        user_id: userId,
        email,
        full_name: fullName,
        roll_number: rollNumber,
        department,
        branch,
        academic_year: academicYear,
        year_of_study: '1st Year',
        section,
        semester,
        class_group: classGroup,
        role,
        is_active: true,
        status: 'active',
      });
    } catch (e) {
      console.warn('Could not upsert profile directly:', e);
    }

    return newProfile;
  }, []);

  // Initialize session
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      setIsLoading(true);

      try {
        const { data: sessionData, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Supabase auth session error:', error.message);
        }

        if (sessionData?.session?.user && mounted) {
          const authUser = sessionData.session.user;
          let dbProfile = await fetchProfileFromSupabase(authUser.id, authUser.email);
          if (!dbProfile && authUser.email) {
            dbProfile = await createProfileIfMissing(authUser.id, authUser.email, authUser.user_metadata);
          }

          if (dbProfile) {
            if (dbProfile.status === 'inactive' || dbProfile.status === 'suspended' || dbProfile.is_active === false) {
              await supabase.auth.signOut();
              if (mounted) {
                setUser(null);
                setProfile(null);
              }
              return;
            }
            if (mounted) {
              setUser({ id: authUser.id, email: authUser.email });
              setProfile(dbProfile);
            }
          }
        } else if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Session initialization error:', err);
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    // Listen to real Supabase auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        let p = await fetchProfileFromSupabase(session.user.id, session.user.email);
        if (!p && session.user.email) {
          p = await createProfileIfMissing(session.user.id, session.user.email, session.user.user_metadata);
        }
        if (p) {
          if (p.status === 'inactive' || p.status === 'suspended' || p.is_active === false) {
            await supabase.auth.signOut();
            if (mounted) {
              setUser(null);
              setProfile(null);
            }
            return;
          }
          if (mounted) {
            setUser({ id: session.user.id, email: session.user.email });
            setProfile(p);
          }
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [fetchProfileFromSupabase, createProfileIfMissing]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const remote = await fetchProfileFromSupabase(user.id, user.email);
    if (remote) {
      setProfile(remote);
    }
  }, [user, fetchProfileFromSupabase]);

  const signIn = async (identifier: string, password: string): Promise<{ error: Error | null }> => {
    const cleanId = identifier.trim();
    if (!cleanId) {
      return { error: new Error('Please enter your email or roll number.') };
    }
    if (!password) {
      return { error: new Error('Please enter your password.') };
    }

    let emailToAuth = cleanId;

    // If identifier is not an email (e.g. Roll Number like 25CS042 or 25ME1A4602)
    if (!cleanId.includes('@')) {
      try {
        const { data: matchedProfile, error: profileErr } = await supabase
          .from('profiles')
          .select('email')
          .ilike('roll_number', cleanId)
          .maybeSingle();

        if (profileErr) {
          console.warn('Roll number lookup warning:', profileErr.message);
        }

        const profData = matchedProfile as unknown as Record<string, unknown> | null;
        if (profData && typeof profData.email === 'string') {
          emailToAuth = profData.email;
        } else {
          return {
            error: new Error(`No account found matching roll number "${cleanId}". Please verify your credentials or contact your administrator.`),
          };
        }
      } catch {
        return {
          error: new Error(`Could not verify roll number "${cleanId}". Please try using your registered email.`),
        };
      }
    }

    // Authenticate with real Supabase Auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToAuth.toLowerCase(),
        password,
      });

      if (!error && data.user) {
        let p = await fetchProfileFromSupabase(data.user.id, data.user.email);
        if (!p && data.user.email) {
          p = await createProfileIfMissing(data.user.id, data.user.email, data.user.user_metadata);
        }

        if (p) {
          // Check if account is inactive or suspended
          if (p.status === 'inactive' || p.status === 'suspended' || p.is_active === false) {
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            return {
              error: new Error(`Your account is currently ${p.status || 'inactive'}. Please contact your college administrator.`),
            };
          }

          const userObj = { id: data.user.id, email: data.user.email };
          setUser(userObj);
          setProfile(p);
          return { error: null };
        }
      }

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: new Error('Invalid credentials. Please verify your roll number/email and password.') };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Authentication request failed.') };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata: {
      roll_number: string;
      full_name: string;
      branch?: string;
      department?: string;
      section?: string;
      semester?: string;
      academic_year?: string;
    }
  ): Promise<{ error: Error | null }> => {
    const fullName = metadata.full_name?.trim();
    if (!fullName) {
      return { error: new Error('Please enter your full name.') };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { error: new Error('Please enter a valid email address.') };
    }

    if (!password || password.length < 6) {
      return { error: new Error('Password must be at least 6 characters long.') };
    }

    const cleanRoll = metadata.roll_number?.trim().toUpperCase();
    if (!cleanRoll) {
      return { error: new Error('Please enter your roll number.') };
    }

    // 1. Roll Number Format Validation & Academic Context Parsing
    const isSuperAdmin = isSystemAdminEmail(cleanEmail);
    let parsed = parseRollNumber(cleanRoll);
    if (!parsed.isValid && isSuperAdmin) {
      parsed = {
        raw: cleanRoll,
        isValid: true,
        joiningYear: 2025,
        collegeCode: 'ADMIN',
        branchCode: 'ADMIN',
        numericRoll: cleanRoll,
        rollSequence: cleanRoll,
        mappedBranchName: 'Administration',
        branchName: 'Administration',
        mappedSubBranchName: 'Super Admin',
        subBranchName: 'Super Admin',
      };
    } else if (!parsed.isValid) {
      return { error: new Error(parsed.errorMessage || 'Invalid roll number format.') };
    }

    // 2. Check duplicate roll number
    try {
      const { data: existingRoll } = await supabase
        .from('profiles')
        .select('id')
        .ilike('roll_number', cleanRoll)
        .maybeSingle();

      if (existingRoll) {
        return { error: new Error('An account already exists with this roll number.') };
      }
    } catch {
      // ignore
    }

    // 3. Check duplicate email
    try {
      const { data: existingEmail } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (existingEmail) {
        return { error: new Error('An account already exists with this email.') };
      }
    } catch {
      // ignore
    }

    const role: UserRole = isSuperAdmin ? 'admin' : 'student';
    const branch = parsed.mappedBranchName || parsed.branchName || metadata.branch || 'CSE';
    const department = metadata.department || (isSuperAdmin ? 'Administration' : (branch.includes('CSE') || branch.includes('Computer') ? 'Engineering & Technology' : `${branch} Department`));
    const subBranch = parsed.mappedSubBranchName || parsed.subBranchName || 'Core';
    const section = metadata.section || 'A';
    const semester = metadata.semester || 'Semester 1';
    const academicYear = metadata.academic_year || '2025-2026';
    const classGroup = deriveClassGroup(cleanRoll, branch, section);
    const joiningYear = parsed.joiningYear || 2025;
    const collegeCode = parsed.collegeCode || 'ME';
    const branchCode = parsed.branchCode || '1A';
    const numericRoll = parsed.numericRoll || parsed.rollSequence || cleanRoll;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            roll_number: cleanRoll,
            branch,
            department,
            sub_branch: subBranch,
            section,
            semester,
            academic_year: academicYear,
            class_group: classGroup,
            role,
            joining_year: joiningYear,
            college_code: collegeCode,
            branch_code: branchCode,
            numeric_roll: numericRoll,
          },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already in use')) {
          return { error: new Error('An account already exists with this email.') };
        }
        return { error: new Error(error.message) };
      }

      if (data.user) {
        const userId = data.user.id;
        const newProf: UserProfile = {
          id: userId,
          user_id: userId,
          email: cleanEmail,
          roll_number: cleanRoll,
          full_name: fullName,
          department,
          branch,
          sub_branch: subBranch,
          academic_year: academicYear,
          year_of_study: '1st Year',
          section,
          semester,
          class_group: classGroup,
          role: 'student',
          joining_year: joiningYear,
          college_code: collegeCode,
          branch_code: branchCode,
          numeric_roll: numericRoll,
          is_active: true,
          status: 'active',
          created_at: new Date().toISOString(),
        };

        // Persist to profiles table
        try {
          await supabase.from('profiles').upsert({
            user_id: userId,
            email: cleanEmail,
            roll_number: cleanRoll,
            full_name: fullName,
            department,
            branch,
            sub_branch: subBranch,
            academic_year: academicYear,
            year_of_study: '1st Year',
            section,
            semester,
            class_group: classGroup,
            role: 'student',
            joining_year: joiningYear,
            college_code: collegeCode,
            branch_code: branchCode,
            numeric_roll: numericRoll,
            is_active: true,
            status: 'active',
          });
        } catch (dbErr) {
          console.warn('Profile DB save warning:', dbErr);
        }

        // Persist to user_roles table
        try {
          await supabase.from('user_roles').upsert({
            user_id: userId,
            role: 'student',
          });
        } catch {
          // ignore
        }

        setUser({ id: userId, email: cleanEmail });
        setProfile(newProf);
        return { error: null };
      }

      return { error: new Error('User registration did not return a user object.') };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Registration failed.') };
    }
  };

  const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { error: new Error('Please enter a valid registered email address.') };
      }
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) {
        return { error: new Error(error.message) };
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Password reset request failed.') };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ error: Error | null }> => {
    if (!profile) return { error: new Error('No active profile to update.') };

    const updated: UserProfile = { ...profile, ...updates };

    // Prevent non-admin users from changing their role
    if (updates.role && profile.role !== 'admin') {
      delete updates.role;
    }

    // Re-derive class group if roll number, branch, or section updated
    if (updates.roll_number || updates.branch || updates.section) {
      updated.class_group = deriveClassGroup(
        updated.roll_number,
        updated.branch,
        updated.section
      );
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates as Record<string, unknown>)
        .eq('user_id', profile.user_id);

      if (error) {
        console.warn('Profile update remote error:', error.message);
      }
    } catch (e) {
      console.warn('Profile update exception:', e);
    }

    setProfile(updated);
    return { error: null };
  };

  const isAdmin = profile?.role === 'admin' || isSystemAdminEmail(user?.email) || isSystemAdminEmail(profile?.email);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAdmin,
        signIn,
        signUp,
        resetPassword,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
