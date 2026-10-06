import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Shield,
  Lock,
  Eye,
  EyeOff,
  User,
  Mail,
  Hash,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface LoginProps {
  defaultMode?: 'login' | 'signup';
}

export default function Login({ defaultMode }: LoginProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signInStudent, signInAdmin, signUpStudent, user, isAdmin } = useAuth();
  const { toast } = useToast();

  // Active portal tab: 'student' or 'admin'
  const [activePortal, setActivePortal] = useState<'student' | 'admin'>('student');

  // Student mode: 'login' or 'signup'
  const initialStudentMode = defaultMode || (location.pathname === '/signup' ? 'signup' : 'login');
  const [studentMode, setStudentMode] = useState<'login' | 'signup'>(initialStudentMode);

  // Student Login State
  const [studentRollNumber, setStudentRollNumber] = useState('');
  const [studentCustomPassword, setStudentCustomPassword] = useState('');
  const [requiresCustomPassword, setRequiresCustomPassword] = useState(false);
  const [showCustomPassword, setShowCustomPassword] = useState(false);

  // Student Sign Up State
  const [signupFullName, setSignupFullName] = useState('');
  const [signupRollNumber, setSignupRollNumber] = useState('');
  const [signupEmail, setSignupEmail] = useState('');

  // Admin Login State
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sync mode if pathname changes
  useEffect(() => {
    if (location.pathname === '/signup') {
      setActivePortal('student');
      setStudentMode('signup');
    } else if (location.pathname === '/login') {
      setStudentMode('login');
    }
  }, [location.pathname]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, isAdmin, navigate]);

  const switchPortal = (portal: 'student' | 'admin') => {
    setActivePortal(portal);
    setErrorMessage('');
    setSuccessMessage('');
    setRequiresCustomPassword(false);
    setStudentCustomPassword('');
  };

  const switchStudentMode = (mode: 'login' | 'signup') => {
    setStudentMode(mode);
    setErrorMessage('');
    setSuccessMessage('');
    setRequiresCustomPassword(false);
    setStudentCustomPassword('');
    if (mode === 'signup') {
      navigate('/signup', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  // 1. Handle Student Sign In
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanRoll = studentRollNumber.trim().toUpperCase();
    if (!cleanRoll) {
      setErrorMessage('Please enter your roll number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signInStudent(
        cleanRoll,
        requiresCustomPassword ? studentCustomPassword : undefined
      );

      if (res.error) {
        if (res.requiresCustomPassword) {
          setRequiresCustomPassword(true);
        }
        setErrorMessage(res.error.message);
      } else {
        toast({
          title: 'Welcome to Study Companion',
          description: 'Logged in successfully.',
        });
        navigate('/dashboard', { replace: true });
      }
    } catch {
      setErrorMessage('Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Handle Student Sign Up
  const handleStudentSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const fullName = signupFullName.trim();
    const rollNumber = signupRollNumber.trim().toUpperCase();
    const email = signupEmail.trim().toLowerCase();

    if (!fullName) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!rollNumber) {
      setErrorMessage('Please enter your roll number.');
      return;
    }
    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signUpStudent(fullName, rollNumber, email);

      if (error) {
        setErrorMessage(error.message);
      } else {
        toast({
          title: 'Account Created',
          description: 'Your student account has been created successfully.',
        });
        setSuccessMessage('Account created successfully! Loading your student dashboard...');
        navigate('/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to create your account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Admin Sign In
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const adminId = adminIdentifier.trim();
    const pass = adminPassword;

    if (!adminId) {
      setErrorMessage('Please enter your admin ID.');
      return;
    }
    if (!pass) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signInAdmin(adminId, pass);

      if (error) {
        setErrorMessage(error.message);
      } else {
        toast({
          title: 'Administrator Access Granted',
          description: 'Welcome to the Admin Portal.',
        });
        navigate('/admin', { replace: true });
      }
    } catch {
      setErrorMessage('Invalid admin credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-md mb-3">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Study Companion
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          {activePortal === 'student'
            ? 'Your institutional academic portal — access subjects, assignments, timetable, and study resources.'
            : 'Institutional Administrator Management Portal'}
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Top Portal Switcher (Student vs Admin) */}
        <div className="flex bg-muted/80 p-1 rounded-2xl mb-4 border border-border/60">
          <button
            type="button"
            onClick={() => switchPortal('student')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activePortal === 'student'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-primary" />
            <span>Student Portal</span>
          </button>
          <button
            type="button"
            onClick={() => switchPortal('admin')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activePortal === 'admin'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield className="w-4 h-4 text-purple-500" />
            <span>Administrator</span>
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-card py-7 px-6 sm:px-9 shadow-sm rounded-2xl border border-border">
          {/* Header Title inside Card */}
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-border/50">
            <div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                {activePortal === 'student'
                  ? studentMode === 'login'
                    ? 'Student Sign In'
                    : 'Student Registration'
                  : 'Admin Login'}
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {activePortal === 'student'
                  ? studentMode === 'login'
                    ? 'Enter your institutional roll number'
                    : 'Simple 3-field registration'
                  : 'Sign in with your administrator credentials'}
              </p>
            </div>

            {/* In Student Portal, toggle between Sign In and Sign Up */}
            {activePortal === 'student' && (
              <div className="flex bg-muted p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => switchStudentMode('login')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    studentMode === 'login'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => switchStudentMode('signup')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    studentMode === 'signup'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ================================================================= */}
          {/* 1. STUDENT AUTHENTICATION FLOW                                    */}
          {/* ================================================================= */}
          {activePortal === 'student' && studentMode === 'login' && (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              {/* Roll Number Only */}
              <div>
                <label
                  htmlFor="student-roll"
                  className="block text-xs font-semibold text-foreground mb-1.5"
                >
                  Roll Number
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="student-roll"
                    type="text"
                    required
                    autoFocus
                    autoComplete="username"
                    value={studentRollNumber}
                    onChange={(e) => setStudentRollNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 25ME1A4602"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm uppercase font-mono rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Sign in directly with your college roll number.
                </p>
              </div>

              {/* Private password field (only displayed if the student previously set a custom password) */}
              {requiresCustomPassword && (
                <div className="pt-1">
                  <label
                    htmlFor="student-custom-pass"
                    className="block text-xs font-semibold text-foreground mb-1.5"
                  >
                    Private Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="student-custom-pass"
                      type={showCustomPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={studentCustomPassword}
                      onChange={(e) => setStudentCustomPassword(e.target.value)}
                      placeholder="Enter your private password"
                      className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustomPassword(!showCustomPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCustomPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl py-2.5 text-xs sm:text-sm font-semibold mt-2 h-10 bg-primary"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>

              {/* Link to Sign Up */}
              <div className="mt-5 pt-4 border-t border-border/60 text-center">
                <p className="text-xs text-muted-foreground">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchStudentMode('signup')}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ================================================================= */}
          {/* 2. STUDENT SIGN UP FLOW                                           */}
          {/* ================================================================= */}
          {activePortal === 'student' && studentMode === 'signup' && (
            <form onSubmit={handleStudentSignup} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-xs font-semibold text-foreground mb-1"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="signup-name"
                    type="text"
                    required
                    autoFocus
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    placeholder="e.g. Sumanth Kumar"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Roll Number */}
              <div>
                <label
                  htmlFor="signup-roll"
                  className="block text-xs font-semibold text-foreground mb-1"
                >
                  Roll Number
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="signup-roll"
                    type="text"
                    required
                    value={signupRollNumber}
                    onChange={(e) => setSignupRollNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 25ME1A4602"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm uppercase font-mono rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Format: Year (25) + College (ME) + Branch (1A) + Roll (4602)
                </p>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-semibold text-foreground mb-1"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="student@college.edu"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl py-2.5 text-xs sm:text-sm font-semibold mt-3 h-10 bg-primary"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    <span>Creating Student Account...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>

              {/* Link to Sign In */}
              <div className="mt-5 pt-4 border-t border-border/60 text-center">
                <p className="text-xs text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchStudentMode('login')}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ================================================================= */}
          {/* 3. ADMIN AUTHENTICATION FLOW                                      */}
          {/* ================================================================= */}
          {activePortal === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              {/* Admin ID / Email */}
              <div>
                <label
                  htmlFor="admin-id"
                  className="block text-xs font-semibold text-foreground mb-1.5"
                >
                  Admin ID / Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-id"
                    type="text"
                    required
                    autoFocus
                    autoComplete="username"
                    value={adminIdentifier}
                    onChange={(e) => setAdminIdentifier(e.target.value)}
                    placeholder="e.g. admin@college.edu or ADMIN ID"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="admin-pass"
                  className="block text-xs font-semibold text-foreground mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-pass"
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter administrator password"
                    className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                  >
                    {showAdminPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Admin Sign In Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl py-2.5 text-xs sm:text-sm font-semibold mt-2 h-10 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Admin Access...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Admin Sign In</span>
                    <Shield className="w-4 h-4" />
                  </div>
                )}
              </Button>

              <div className="mt-5 pt-4 border-t border-border/60 text-center">
                <p className="text-[11px] text-muted-foreground">
                  Administrator accounts are provisioned exclusively through the Admin Panel. Public admin registration is disabled.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
