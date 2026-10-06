import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  GraduationCap,
  Lock,
  Eye,
  EyeOff,
  User,
  Mail,
  Hash,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { parseRollNumber } from '@/lib/rollNumberParser';

interface LoginProps {
  defaultMode?: 'login' | 'signup';
}

export default function Login({ defaultMode }: LoginProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword, user, isAdmin } = useAuth();
  const { toast } = useToast();

  // Determine initial mode from prop or URL
  const initialMode = defaultMode || (location.pathname === '/signup' ? 'signup' : 'login');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(initialMode);

  // Sign In Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign Up Form State
  const [signupFullName, setSignupFullName] = useState('');
  const [signupRollNumber, setSignupRollNumber] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);

  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sync mode if pathname changes
  useEffect(() => {
    if (location.pathname === '/signup') {
      setAuthMode('signup');
    } else if (location.pathname === '/login') {
      setAuthMode('login');
    }
  }, [location.pathname]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, isAdmin, navigate]);

  // Switch modes and clear messages
  const switchMode = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setErrorMessage('');
    setSuccessMessage('');
    if (mode === 'signup') {
      navigate('/signup', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  // Handle Sign In submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setErrorMessage('Please enter your roll number or email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signIn(loginIdentifier.trim(), loginPassword);
      if (error) {
        setErrorMessage(error.message);
      } else {
        toast({
          title: 'Welcome to Study Companion',
          description: 'Logged in successfully.',
        });
        // Redirect handled by useEffect
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Sign Up submission
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const fullName = signupFullName.trim();
    const rollNumber = signupRollNumber.trim().toUpperCase();
    const email = signupEmail.trim().toLowerCase();
    const password = signupPassword;
    const confirmPassword = signupConfirmPassword;

    // 1. Validation: Full Name
    if (!fullName) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    // 2. Validation: Roll Number
    if (!rollNumber) {
      setErrorMessage('Please enter your roll number.');
      return;
    }

    const parsedRoll = parseRollNumber(rollNumber);
    if (!parsedRoll.isValid) {
      setErrorMessage(parsedRoll.errorMessage || 'Invalid roll number format.');
      return;
    }

    // 3. Validation: Email
    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // 4. Validation: Password & Confirm Password
    if (!password) {
      setErrorMessage('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signUp(email, password, {
        roll_number: rollNumber,
        full_name: fullName,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        toast({
          title: 'Account Created',
          description: 'Your student account has been created successfully.',
        });
        setSuccessMessage('Account created successfully! Loading your academic dashboard...');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Forgot Password submission
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      toast({
        title: 'Email Required',
        description: 'Please enter a valid registered email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await resetPassword(resetEmail.trim());
      if (error) {
        toast({
          title: 'Reset Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setResetSent(true);
        toast({
          title: 'Reset Link Sent',
          description: 'Password reset link sent to your email. Please check your inbox.',
        });
      }
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Could not process password reset.',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo & Header */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-md mb-3">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Study Companion
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          {authMode === 'login'
            ? 'Your personal academic portal — everything you need for your college academics in one place.'
            : 'Create your student account'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-7 px-6 sm:px-9 shadow-sm rounded-2xl border border-border">
          {/* Header title & Mode switch buttons */}
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-border/50">
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </h2>
            <div className="flex bg-muted p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  authMode === 'login'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  authMode === 'signup'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign Up
              </button>
            </div>
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

          {/* ======================= 1. SIGN IN FORM ======================= */}
          {authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Roll Number or Email */}
              <div>
                <label htmlFor="login-id" className="block text-xs font-semibold text-foreground mb-1.5">
                  Roll Number or Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-id"
                    type="text"
                    required
                    autoFocus
                    autoComplete="username"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. 25ME1A4602 or name@college.edu"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-pass" className="block text-xs font-semibold text-foreground">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(loginIdentifier.includes('@') ? loginIdentifier : '');
                      setResetSent(false);
                      setShowForgotPassword(true);
                    }}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-pass"
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

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

              {/* Switch to Sign Up */}
              <div className="mt-6 pt-5 border-t border-border/60 text-center">
                <p className="text-xs text-muted-foreground">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* ======================= 2. DIRECT STUDENT SIGNUP FORM ======================= */
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label htmlFor="signup-name" className="block text-xs font-semibold text-foreground mb-1">
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
                <label htmlFor="signup-roll" className="block text-xs font-semibold text-foreground mb-1">
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
                {signupRollNumber.length >= 6 && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Format: Year (25) + College (ME) + Branch (1A) + Roll (4602)
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="signup-email" className="block text-xs font-semibold text-foreground mb-1">
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

              {/* Password */}
              <div>
                <label htmlFor="signup-pass" className="block text-xs font-semibold text-foreground mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="signup-pass"
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="signup-cpass" className="block text-xs font-semibold text-foreground mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="signup-cpass"
                    type={showSignupConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showSignupConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignupConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Create Account Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl py-2.5 text-xs sm:text-sm font-semibold mt-3 h-10 bg-primary"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>

              {/* Switch to Sign In */}
              <div className="mt-5 pt-4 border-t border-border/60 text-center">
                <p className="text-xs text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Forgot Password Dialog */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-lg">
            <div className="flex items-center gap-2 text-foreground font-semibold text-base">
              <HelpCircle className="w-5 h-5 text-primary" />
              <h3>Reset Password</h3>
            </div>

            {resetSent ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Password reset link sent to <strong>{resetEmail}</strong>. Please check your inbox and follow the instructions to reset your password.
                  </span>
                </div>
                <Button
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full rounded-xl"
                  size="sm"
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter your registered institutional email address. We will send you a secure link to reset your account password.
                </p>

                <div>
                  <label htmlFor="reset-email" className="block text-xs font-medium text-foreground mb-1">
                    Registered Email
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@college.edu"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-muted/60 text-[11px] text-muted-foreground leading-relaxed">
                  Note: If you only know your Roll Number, please contact your department academic administrator to reset your credentials.
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1 rounded-xl text-xs"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isResetting}
                    className="flex-1 rounded-xl text-xs bg-primary"
                    size="sm"
                  >
                    {isResetting ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
