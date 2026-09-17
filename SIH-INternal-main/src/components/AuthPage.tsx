import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Eye, EyeOff, KeyRound, Mail, Rocket, ShieldCheck, UserPlus, Users, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { api } from '../api';
import { User, UserRole } from '../types';

interface AuthPageProps {
  onAuthenticated: (user: User) => void;
  onBackToLanding: () => void;
}

type AuthMode = 'login' | 'signup';

const roles: Array<{ value: UserRole; label: string; description: string }> = [
  { value: 'STARTUP', label: 'Startup', description: 'Submit solutions and track opportunities' },
  { value: 'GOVERNMENT_OFFICER', label: 'Government', description: 'Publish challenges and manage pilots' },
  { value: 'PROCUREMENT_OFFICER', label: 'Procurement Officer', description: 'Move validated solutions to scale' },
  { value: 'EVALUATOR', label: 'Evaluator', description: 'Review applications and score proposals' },
  { value: 'SUPER_ADMIN', label: 'Admin', description: 'Oversee the complete platform' },
];

const demoAccounts: Record<UserRole, { email: string; password: string }> = {
  STARTUP: { email: 'startup@innovprocure.com', password: 'InnovProcure@123' },
  GOVERNMENT_OFFICER: { email: 'officer@innovprocure.gov.in', password: 'InnovProcure@123' },
  PROCUREMENT_OFFICER: { email: 'procurement@innovprocure.gov.in', password: 'InnovProcure@123' },
  EVALUATOR: { email: 'evaluator@innovprocure.gov.in', password: 'InnovProcure@123' },
  SUPER_ADMIN: { email: 'admin@innovprocure.gov.in', password: 'InnovProcure@123' },
};

export function AuthPage({ onAuthenticated, onBackToLanding }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('STARTUP');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(demoAccounts.STARTUP.email);
  const [password, setPassword] = useState(demoAccounts.STARTUP.password);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chooseRole = (role: UserRole) => {
    setSelectedRole(role);
    if (mode === 'login') {
      setEmail(demoAccounts[role].email);
      setPassword(demoAccounts[role].password);
    }
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    if (nextMode === 'signup') {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } else {
      setEmail(demoAccounts[selectedRole].email);
      setPassword(demoAccounts[selectedRole].password);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      const data = mode === 'login'
        ? await api.login(email, password)
        : await api.register({ name, email, password, role: selectedRole });
      onAuthenticated(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <button className="auth-back-link" onClick={onBackToLanding}><ArrowLeft size={16} /> Back to landing page</button>
        <div className="auth-visual-content">
          <div className="auth-mark"><ShieldCheck size={27} /></div>
          <span className="auth-eyebrow">InnovProcure platform</span>
          <h1>Good ideas deserve a clear path to impact.</h1>
          <p>Join the public innovation network connecting government challenges, startups, evaluators, and procurement teams.</p>
          <div className="auth-trust-list"><span><CheckCircle2 size={16} /> Secure role-based access</span><span><CheckCircle2 size={16} /> Transparent innovation workflow</span><span><CheckCircle2 size={16} /> Built for measurable public impact</span></div>
        </div>
        <div className="auth-visual-footer">Government of Maharashtra <span /> National Innovation Procurement Infrastructure</div>
      </div>

      <div className="auth-panel">
        <button className="auth-mobile-back" onClick={onBackToLanding}><ArrowLeft size={16} /> InnovProcure</button>
        <div className="auth-form-wrap">
          <div className="auth-form-heading"><span className="auth-eyebrow">Your workspace awaits</span><h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2><p>{mode === 'login' ? 'Sign in to continue to your role-based dashboard.' : 'Choose your role and join the innovation ecosystem.'}</p></div>
          <div className="auth-mode-switch"><button className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>Log in</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => switchMode('signup')}>Sign up</button></div>

          <div className="auth-role-grid">
            {roles.map((role) => <button type="button" key={role.value} className={selectedRole === role.value ? 'auth-role selected' : 'auth-role'} onClick={() => chooseRole(role.value)}><span className="auth-role-icon">{role.value === 'STARTUP' ? <Rocket size={16} /> : role.value === 'SUPER_ADMIN' ? <KeyRound size={16} /> : role.value === 'EVALUATOR' ? <CheckCircle2 size={16} /> : role.value === 'PROCUREMENT_OFFICER' ? <Building2 size={16} /> : <Users size={16} />}</span><span><strong>{role.label}</strong><small>{role.description}</small></span></button>)}
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && <label><span>Full name</span><div className="auth-input"><UserPlus size={16} /><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></div></label>}
            <label><span>Email address</span><div className="auth-input"><Mail size={16} /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@organisation.com" /></div></label>
            <label><span>Password</span><div className="auth-input"><KeyRound size={16} /><input required minLength={6} type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
            {mode === 'signup' && <label><span>Confirm password</span><div className="auth-input"><KeyRound size={16} /><input required minLength={6} type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" /></div></label>}
            {error && <div className="auth-error"><X size={15} /> {error}</div>}
            <button className="auth-submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait...' : mode === 'login' ? 'Log in to dashboard' : 'Create account'} {!isSubmitting && <ArrowRight size={17} />}</button>
          </form>
          {mode === 'login' && <p className="auth-demo-note">Demo access is prefilled for the selected role.</p>}
          <p className="auth-legal">By continuing, you agree to the platform's access and usage policies.</p>
        </div>
      </div>
    </div>
  );
}
