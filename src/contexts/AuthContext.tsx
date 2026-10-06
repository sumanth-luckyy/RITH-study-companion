import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/integrations/firebase/client';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updatePassword as firebaseUpdatePassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
} from 'firebase/firestore';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole, UserStatus, deriveClassGroup } from '@/types/academic';
import { parseRollNumber } from '@/lib/rollNumberParser';

interface AuthContextType {
  user: { id: string; email?: string } | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (identifier: string, password?: string) => Promise<{ error: Error | null; requiresCustomPassword?: boolean }>;
  signInStudent: (rollNumber: string, customPassword?: string) => Promise<{ error: Error | null; requiresCustomPassword?: boolean }>;
  signInAdmin: (identifier: string, password: string) => Promise<{ error: Error | null }>;
  signUpStudent: (fullName: string, rollNumber: string, email: string) => Promise<{ error: Error | null }>;
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
  changePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const ADMIN_EMAILS = ['sumanth.akkivarapu@gmail.com'];

export function isSystemAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * Maps Firebase Auth errors to user-friendly academic messages
 */
export function mapFirebaseAuthError(err: unknown, mode: 'signup' | 'signin' = 'signup'): string {
  if (!err) {
    return mode === 'signup'
      ? 'Unable to create your account. Please try again.'
      : 'Unable to sign in. Please try again.';
  }

  const code = (err as { code?: string })?.code || '';
  const message = (err as Error)?.message || '';

  if (code === 'auth/email-already-in-use' || message.includes('email-already-in-use')) {
    return 'An account with this email already exists. Please sign in.';
  }
  if (code === 'auth/invalid-email' || message.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/operation-not-allowed' || message.includes('operation-not-allowed')) {
    return 'Email/password authentication is currently disabled. Enable it in Firebase Authentication.';
  }
  if (code === 'auth/weak-password' || message.includes('weak-password')) {
    return 'The account credential could not be created.';
  }
  if (code === 'auth/network-request-failed' || message.includes('network-request-failed')) {
    return 'Network error. Please check your connection and try again.';
  }
  if (
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    message.includes('user-not-found') ||
    message.includes('wrong-password') ||
    message.includes('invalid-credential')
  ) {
    return mode === 'signin' ? 'Student account not found.' : 'Unable to create your account. Please try again.';
  }
  if (code === 'auth/too-many-requests' || message.includes('too-many-requests')) {
    return 'Too many attempts. Please try again in a few minutes.';
  }

  return mode === 'signup'
    ? 'Unable to create your account. Please try again.'
    : 'Unable to sign in. Please try again.';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(
    async (userId: string, emailFallback?: string): Promise<UserProfile | null> => {
      // 1. Try Firestore first
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const p = userDocSnap.data() as Record<string, unknown>;
          const email = (p.email as string) || emailFallback || '';
          const role = isSystemAdminEmail(email) ? 'admin' : ((p.role as UserRole) || 'student');
          const status = (p.status as UserStatus) || (p.is_active === false ? 'inactive' : 'active');
          return {
            id: userId,
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
            class_group:
              (p.class_group as string) ||
              deriveClassGroup((p.roll_number as string) || '', (p.branch as string) || 'CSE', (p.section as string) || 'A'),
            role,
            avatar_url: p.avatar_url as string | undefined,
            is_active: status === 'active',
            status,
            joining_year: p.joining_year as number | undefined,
            college_code: p.college_code as string | undefined,
            branch_code: p.branch_code as string | undefined,
            numeric_roll: p.numeric_roll as string | undefined,
            created_at: (p.created_at as string) || new Date().toISOString(),
          };
        }
      } catch (e) {
        console.warn('Firestore fetchProfile warning:', e);
      }

      // 2. Fallback to Supabase profiles table
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
            class_group:
              (p.class_group as string) ||
              deriveClassGroup((p.roll_number as string) || '', (p.branch as string) || 'CSE', (p.section as string) || 'A'),
            role,
            avatar_url: p.avatar_url as string | undefined,
            is_active: status === 'active',
            status,
            joining_year: p.joining_year as number | undefined,
            college_code: p.college_code as string | undefined,
            branch_code: p.branch_code as string | undefined,
            numeric_roll: p.numeric_roll as string | undefined,
            created_at: (p.created_at as string) || new Date().toISOString(),
          };
        }
      } catch (e) {
        console.warn('Supabase fetchProfile warning:', e);
      }

      return null;
    },
    []
  );

  const createProfileIfMissing = useCallback(
    async (
      userId: string,
      email: string,
      metadata?: Record<string, unknown>
    ): Promise<UserProfile> => {
      const isSuperAdmin = isSystemAdminEmail(email);
      const fullName = (metadata?.full_name as string) || (isSuperAdmin ? 'Sumanth' : email.split('@')[0] || 'Student');
      const rollNumber =
        (metadata?.roll_number as string) || (isSuperAdmin ? 'ADMIN-01' : `25CS${userId.slice(0, 3).toUpperCase()}`);
      const branch = (metadata?.branch as string) || 'CSE';
      const section = (metadata?.section as string) || 'A';
      const semester = (metadata?.semester as string) || 'Semester 1';
      const academicYear = (metadata?.academic_year as string) || '2025-2026';
      const department =
        (metadata?.department as string) || (isSuperAdmin ? 'Administration' : `${branch} Department`);
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

      // Save to Firestore
      try {
        await setDoc(doc(db, 'users', userId), {
          uid: userId,
          email,
          roll_number: rollNumber,
          full_name: fullName,
          role,
          department,
          branch,
          academic_year: academicYear,
          year_of_study: '1st Year',
          section,
          semester,
          class_group: classGroup,
          is_active: true,
          status: 'active',
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Could not save profile to Firestore:', e);
      }

      // Sync to Supabase
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
        console.warn('Could not upsert profile to Supabase:', e);
      }

      return newProfile;
    },
    []
  );

  // Initialize session
  useEffect(() => {
    let mounted = true;

    // Listen to Firebase auth state
    const unsubscribeFirebase = onAuthStateChanged(auth, async (fbUser) => {
      if (!mounted) return;

      if (fbUser) {
        let dbProfile = await fetchProfile(fbUser.uid, fbUser.email || undefined);
        if (!dbProfile && fbUser.email) {
          dbProfile = await createProfileIfMissing(fbUser.uid, fbUser.email);
        }

        if (dbProfile) {
          if (dbProfile.status === 'inactive' || dbProfile.status === 'suspended' || dbProfile.is_active === false) {
            await firebaseSignOut(auth);
            if (mounted) {
              setUser(null);
              setProfile(null);
            }
            return;
          }

          if (mounted) {
            setUser({ id: fbUser.uid, email: fbUser.email || undefined });
            setProfile(dbProfile);
          }
        }
      } else {
        // Check Supabase fallback session
        try {
          const { data: supaSession } = await supabase.auth.getSession();
          if (supaSession?.session?.user && mounted) {
            const authUser = supaSession.session.user;
            const dbProfile = await fetchProfile(authUser.id, authUser.email);
            if (dbProfile && mounted) {
              setUser({ id: authUser.id, email: authUser.email });
              setProfile(dbProfile);
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // ignore
        }

        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      }

      if (mounted) {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribeFirebase();
    };
  }, [fetchProfile, createProfileIfMissing]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const remote = await fetchProfile(user.id, user.email);
    if (remote) {
      setProfile(remote);
    }
  }, [user, fetchProfile]);

  /**
   * 1. Student Sign In (Roll Number only)
   */
  const signInStudent = async (
    rollNumber: string,
    customPassword?: string
  ): Promise<{ error: Error | null; requiresCustomPassword?: boolean }> => {
    const cleanRoll = rollNumber.trim().toUpperCase();
    if (!cleanRoll) {
      return { error: new Error('Please enter your roll number.') };
    }

    // Validate format
    const parsed = parseRollNumber(cleanRoll);
    if (!parsed.isValid) {
      return { error: new Error('Invalid roll number.') };
    }

    // Lookup student's registered email
    let studentEmail = '';
    let studentRole: UserRole = 'student';
    let studentStatus: UserStatus = 'active';

    // 1. Check Firestore
    try {
      const q = query(collection(db, 'users'), where('roll_number', '==', cleanRoll));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const u = snap.docs[0].data() as Record<string, unknown>;
        studentEmail = (u.email as string) || '';
        studentRole = (u.role as UserRole) || 'student';
        studentStatus = (u.status as UserStatus) || (u.is_active === false ? 'inactive' : 'active');
      }
    } catch (e) {
      console.warn('Firestore student lookup warning:', e);
    }

    // 2. Fallback to Supabase
    if (!studentEmail) {
      try {
        const { data: matchedProfile } = await supabase
          .from('profiles')
          .select('email, role, status, is_active')
          .ilike('roll_number', cleanRoll)
          .maybeSingle();

        if (matchedProfile) {
          studentEmail = matchedProfile.email || '';
          studentRole = (matchedProfile.role as UserRole) || 'student';
          studentStatus =
            (matchedProfile.status as UserStatus) || (matchedProfile.is_active === false ? 'inactive' : 'active');
        }
      } catch (e) {
        console.warn('Supabase student lookup warning:', e);
      }
    }

    if (!studentEmail) {
      return { error: new Error('Student account not found.') };
    }

    if (studentRole === 'admin' || isSystemAdminEmail(studentEmail)) {
      return { error: new Error('Student account not found.') };
    }

    if (studentStatus === 'inactive' || studentStatus === 'suspended') {
      return {
        error: new Error(`Your account is currently ${studentStatus}. Please contact your college administrator.`),
      };
    }

    // Default password is roll number internally
    const passwordToTry = customPassword || cleanRoll;

    // Authenticate with Firebase
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        studentEmail.toLowerCase(),
        passwordToTry
      );

      const fbUser = userCredential.user;
      let p = await fetchProfile(fbUser.uid, fbUser.email || studentEmail);
      if (!p) {
        p = await createProfileIfMissing(fbUser.uid, studentEmail, { roll_number: cleanRoll });
      }

      if (p) {
        setUser({ id: fbUser.uid, email: fbUser.email || studentEmail });
        setProfile(p);
        return { error: null };
      }
    } catch (fbErr: unknown) {
      const code = (fbErr as { code?: string })?.code || '';
      if (!customPassword && (code === 'auth/wrong-password' || code === 'auth/invalid-credential')) {
        return {
          error: new Error('A private password has been set for this account. Please enter your password to sign in.'),
          requiresCustomPassword: true,
        };
      }

      // Supabase auth fallback
      try {
        const { data: supaData, error: supaErr } = await supabase.auth.signInWithPassword({
          email: studentEmail.toLowerCase(),
          password: passwordToTry,
        });

        if (!supaErr && supaData.user) {
          const p = await fetchProfile(supaData.user.id, supaData.user.email || studentEmail);
          if (p) {
            setUser({ id: supaData.user.id, email: supaData.user.email || studentEmail });
            setProfile(p);
            return { error: null };
          }
        }
      } catch {
        // ignore
      }

      return { error: new Error(mapFirebaseAuthError(fbErr, 'signin')) };
    }

    return { error: new Error('Unable to sign in. Please try again.') };
  };

  /**
   * 2. Administrator Sign In (ID + Password)
   */
  const signInAdmin = async (
    identifier: string,
    password: string
  ): Promise<{ error: Error | null }> => {
    const cleanId = identifier.trim();
    if (!cleanId) {
      return { error: new Error('Please enter your admin ID.') };
    }
    if (!password) {
      return { error: new Error('Please enter your password.') };
    }

    let emailToAuth = cleanId;

    if (!cleanId.includes('@')) {
      try {
        const q = query(collection(db, 'users'), where('roll_number', '==', cleanId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const u = snap.docs[0].data();
          if (u.email) emailToAuth = u.email;
        }
      } catch {
        // continue
      }

      if (!emailToAuth.includes('@')) {
        try {
          const { data: matchedProfile } = await supabase
            .from('profiles')
            .select('email, role')
            .ilike('roll_number', cleanId)
            .maybeSingle();

          if (matchedProfile?.email) {
            emailToAuth = matchedProfile.email;
          }
        } catch {
          // continue
        }
      }
    }

    // Authenticate with Firebase
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        emailToAuth.toLowerCase(),
        password
      );

      const fbUser = userCredential.user;
      const p = await fetchProfile(fbUser.uid, fbUser.email || emailToAuth);

      const isUserAdmin = p?.role === 'admin' || isSystemAdminEmail(fbUser.email) || isSystemAdminEmail(p?.email);
      if (!isUserAdmin) {
        await firebaseSignOut(auth);
        setUser(null);
        setProfile(null);
        return { error: new Error('Invalid admin credentials.') };
      }

      setUser({ id: fbUser.uid, email: fbUser.email || emailToAuth });
      if (p) setProfile(p);
      return { error: null };
    } catch {
      // Supabase fallback
      try {
        const { data: supaData, error: supaErr } = await supabase.auth.signInWithPassword({
          email: emailToAuth.toLowerCase(),
          password,
        });

        if (!supaErr && supaData.user) {
          const p = await fetchProfile(supaData.user.id, supaData.user.email || emailToAuth);
          const isUserAdmin = p?.role === 'admin' || isSystemAdminEmail(supaData.user.email) || isSystemAdminEmail(p?.email);
          if (!isUserAdmin) {
            await supabase.auth.signOut();
            return { error: new Error('Invalid admin credentials.') };
          }
          setUser({ id: supaData.user.id, email: supaData.user.email || emailToAuth });
          if (p) setProfile(p);
          return { error: null };
        }
      } catch {
        // continue
      }

      return { error: new Error('Invalid admin credentials.') };
    }
  };

  const signIn = async (
    identifier: string,
    password?: string
  ): Promise<{ error: Error | null; requiresCustomPassword?: boolean }> => {
    if (!password) {
      return signInStudent(identifier);
    }
    if (!identifier.includes('@') && !identifier.toLowerCase().startsWith('admin')) {
      return signInStudent(identifier, password);
    }
    return signInAdmin(identifier, password);
  };

  /**
   * 3. Student Registration
   */
  const signUpStudent = async (
    fullName: string,
    rollNumber: string,
    email: string
  ): Promise<{ error: Error | null }> => {
    // 1. Normalize inputs
    const normalizedName = fullName.trim();
    if (!normalizedName) {
      return { error: new Error('Please enter your full name.') };
    }

    const normalizedRoll = rollNumber.trim().toUpperCase();
    if (!normalizedRoll) {
      return { error: new Error('Please enter your roll number.') };
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
      return { error: new Error('Please enter a valid email address.') };
    }

    // Block admin emails from public signup
    if (isSystemAdminEmail(normalizedEmail)) {
      return { error: new Error('This email is reserved for administrators.') };
    }

    // 2. Format validation using academic parser
    const parsed = parseRollNumber(normalizedRoll);
    if (!parsed.isValid) {
      return { error: new Error('Invalid roll number.') };
    }

    // 3. Roll number duplicate check
    try {
      const q = query(collection(db, 'users'), where('roll_number', '==', normalizedRoll));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { error: new Error('An account with this roll number already exists. Please sign in.') };
      }
    } catch (e) {
      console.warn('Firestore roll check warning:', e);
    }

    try {
      const { data: existingRoll } = await supabase
        .from('profiles')
        .select('id')
        .ilike('roll_number', normalizedRoll)
        .maybeSingle();

      if (existingRoll) {
        return { error: new Error('An account with this roll number already exists. Please sign in.') };
      }
    } catch {
      // continue
    }

    // 4. Email duplicate check
    try {
      const q = query(collection(db, 'users'), where('email', '==', normalizedEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { error: new Error('An account with this email already exists. Please sign in.') };
      }
    } catch (e) {
      console.warn('Firestore email check warning:', e);
    }

    try {
      const { data: existingEmail } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', normalizedEmail)
        .maybeSingle();

      if (existingEmail) {
        return { error: new Error('An account with this email already exists. Please sign in.') };
      }
    } catch {
      // continue
    }

    // 5. Academic derivation from parser
    const branch = parsed.mappedBranchName || parsed.branchName || 'CSE';
    const subBranch = parsed.mappedSubBranchName || parsed.subBranchName || 'Core';
    const department =
      branch.includes('CSE') || branch.includes('Computer') ? 'Engineering & Technology' : `${branch} Department`;
    const joiningYear = parsed.joiningYear || 2025;
    const collegeCode = parsed.collegeCode || 'ME';
    const branchCode = parsed.branchCode || '1A';
    const numericRoll = parsed.numericRoll || normalizedRoll;
    const section = 'A';
    const semester = 'Semester 1';
    const academicYear = `${joiningYear}–${joiningYear + 1}`;
    const classGroup = deriveClassGroup(normalizedRoll, branch, section);

    // Roll number is the default internal password
    const internalInitialPassword = normalizedRoll;

    // 6. Create Firebase user
    let firebaseUid = '';
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        internalInitialPassword
      );
      firebaseUid = userCredential.user.uid;
    } catch (err: unknown) {
      return { error: new Error(mapFirebaseAuthError(err, 'signup')) };
    }

    const userId = firebaseUid || `usr-${Date.now()}`;
    const newProf: UserProfile = {
      id: userId,
      user_id: userId,
      email: normalizedEmail,
      roll_number: normalizedRoll,
      full_name: normalizedName,
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

    // 7. Save to Firestore users/{uid}
    try {
      await setDoc(doc(db, 'users', userId), {
        uid: userId,
        email: normalizedEmail,
        roll_number: normalizedRoll,
        full_name: normalizedName,
        role: 'student',
        department,
        branch,
        sub_branch: subBranch,
        academic_year: academicYear,
        year_of_study: '1st Year',
        section,
        semester,
        class_group: classGroup,
        joining_year: joiningYear,
        college_code: collegeCode,
        branch_code: branchCode,
        numeric_roll: numericRoll,
        created_at: new Date().toISOString(),
        is_active: true,
        status: 'active',
      });
    } catch (e) {
      console.warn('Firestore setDoc warning:', e);
    }

    // 8. Sync to Supabase profiles
    try {
      await supabase.from('profiles').upsert({
        user_id: userId,
        email: normalizedEmail,
        roll_number: normalizedRoll,
        full_name: normalizedName,
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
    } catch (e) {
      console.warn('Supabase profile sync warning:', e);
    }

    try {
      await supabase.from('user_roles').upsert({
        user_id: userId,
        role: 'student',
      });
    } catch {
      // continue
    }

    // 9. Automatically authenticate the newly created student and set state
    setUser({ id: userId, email: normalizedEmail });
    setProfile(newProf);
    return { error: null };
  };

  const signUp = async (
    email: string,
    _password: string,
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
    return signUpStudent(metadata.full_name, metadata.roll_number, email);
  };

  const changePassword = async (newPassword: string): Promise<{ error: Error | null }> => {
    if (!newPassword || newPassword.length < 6) {
      return { error: new Error('Password must be at least 6 characters.') };
    }

    try {
      if (auth.currentUser) {
        await firebaseUpdatePassword(auth.currentUser, newPassword);
      }
      try {
        await supabase.auth.updateUser({ password: newPassword });
      } catch {
        // continue
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: new Error(mapFirebaseAuthError(err, 'signin')) };
    }
  };

  const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { error: new Error('Please enter a valid registered email address.') };
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return { error: null };
    } catch {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) {
          return { error: new Error(error.message) };
        }
        return { error: null };
      } catch {
        return { error: new Error('Password reset request failed.') };
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase sign out error:', e);
    }
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase sign out error:', e);
    }
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ error: Error | null }> => {
    if (!profile) return { error: new Error('No active profile to update.') };

    const updated: UserProfile = { ...profile, ...updates };

    if (updates.role && profile.role !== 'admin') {
      delete updates.role;
    }

    if (updates.roll_number || updates.branch || updates.section) {
      updated.class_group = deriveClassGroup(updated.roll_number, updated.branch, updated.section);
    }

    try {
      await setDoc(doc(db, 'users', profile.user_id), updates, { merge: true });
    } catch (e) {
      console.warn('Firestore updateProfile warning:', e);
    }

    try {
      await supabase
        .from('profiles')
        .update(updates as Record<string, unknown>)
        .eq('user_id', profile.user_id);
    } catch (e) {
      console.warn('Supabase updateProfile warning:', e);
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
        signInStudent,
        signInAdmin,
        signUpStudent,
        signUp,
        resetPassword,
        changePassword,
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
