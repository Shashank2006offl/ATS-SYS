import { useState, useRef, useEffect } from 'react';
import {
  UploadCloud, FileText, Moon, Sun, Loader2,
  Target, Briefcase, TrendingUp, AlertTriangle,
  ChevronRight, DollarSign, Lightbulb, Star,
  Lock, Mail, LogOut, Key, UserPlus, LogIn
} from 'lucide-react';
import { auth } from './firebase';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  getAdditionalUserInfo,
  EmailAuthProvider,
  linkWithCredential,
  signOut
} from 'firebase/auth';

import ScoreRing from './components/ScoreRing';
import InsightCard from './components/InsightCard';
import TagList from './components/TagList';
import ActionList from './components/ActionList';
import LandingPage from './components/LandingPage';
import logoImg from './assets/logo.webp';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function App() {
  const [darkMode, setDarkMode]           = useState(true);
  const [file, setFile]                   = useState(null);
  const [isDragging, setIsDragging]       = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [role, setRole]                   = useState('Machine Learning');
  const [country, setCountry]             = useState('United States');
  const [expValue, setExpValue]           = useState(0);
  const [expUnit, setExpUnit]             = useState('Years');
  const [isAnalyzing, setIsAnalyzing]     = useState(false);
  const [results, setResults]             = useState(null);
  const [error, setError]                 = useState(null);
  const fileInputRef                      = useRef(null);

  // Authentication States
  const [user, setUser]                   = useState(null);
  const [authLoading, setAuthLoading]     = useState(true);
  const [username, setUsername]           = useState('');
  const [password, setPassword]           = useState('');
  const [needsSetup, setNeedsSetup]       = useState(false);
  const [setupUsername, setSetupUsername] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [authError, setAuthError]         = useState(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [showAuth, setShowAuth]           = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Auto-logout after 2 hours
  useEffect(() => {
    let logoutTimer;
    if (user && !needsSetup) {
      logoutTimer = setTimeout(() => {
        signOut(auth).catch(console.error);
        setShowAuth(false);
      }, 7200000); // 2 hours
    }
    return () => clearTimeout(logoutTimer);
  }, [user, needsSetup]);

  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') setFile(f);
    else alert('Please upload a PDF file.');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setAuthError('Please fill in all fields.');
      return;
    }
    
    setAuthSubmitting(true);
    setAuthError(null);
    
    // Fake email trick for Firebase
    const safeUsername = username.trim().toLowerCase();
    const fakeEmail = `${safeUsername}@luminarole.ai.local`;

    try {
      await signInWithEmailAndPassword(auth, fakeEmail, password);
    } catch (err) {
      console.error(err);
      let cleanMsg = err.message;
      if (err.code === 'auth/invalid-credential') cleanMsg = 'Invalid username or password.';
      setAuthError(cleanMsg);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthSubmitting(true);
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      const result = await signInWithPopup(auth, provider);
      const details = getAdditionalUserInfo(result);
      if (details?.isNewUser) {
        setNeedsSetup(true);
      }
    } catch (err) {
      console.error(err);
      setAuthError(err.message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSetupAccount = async (e) => {
    e.preventDefault();
    const safeUsername = setupUsername.trim();
    if (!safeUsername) return;
    
    if (!/^[a-zA-Z0-9_]+$/.test(safeUsername)) {
      setAuthError('Username can only contain letters, numbers, and underscores.');
      return;
    }
    if (setupPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    
    setAuthError(null);
    try {
      const fakeEmail = `${safeUsername.toLowerCase()}@luminarole.ai.local`;
      const credential = EmailAuthProvider.credential(fakeEmail, setupPassword);
      await linkWithCredential(auth.currentUser, credential);
      await updateProfile(auth.currentUser, { displayName: safeUsername });
      setNeedsSetup(false);
    } catch(err) {
      console.error(err);
      let cleanMsg = err.message;
      if (err.code === 'auth/email-already-in-use') cleanMsg = 'This username is already taken.';
      setAuthError(cleanMsg);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      reset();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file || !jobDescription.trim()) {
      alert('Please provide both a resume PDF and a job description.');
      return;
    }
    setIsAnalyzing(true); setResults(null); setError(null);
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jd', jobDescription);
    formData.append('country', country);
    formData.append('role', role);
    formData.append('exp_value', expValue);
    formData.append('exp_unit', expUnit);
    try {
      const idToken = await user.getIdToken();
      const res  = await fetch(`${API_URL}/analyze`, { 
        method: 'POST', 
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        body: formData 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      setResults(data);
    } catch (err) {
      setError(`${err.message} (Target: ${API_URL})`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => { setFile(null); setJobDescription(''); setRole('Machine Learning'); setCountry('United States'); setExpValue(0); setExpUnit('Years'); setResults(null); setError(null); };

  // 1. Loading Screen
  if (authLoading) {
    return (
      <div className="auth-fullscreen-loader" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <img src={logoImg} alt="LuminaRole.ai Logo" className="hero__logo" onError={(e) => e.target.style.display='none'} fetchPriority="high" style={{ marginBottom: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Loader2 className="spin text-accent" size={24} />
          <p>Loading Intelligence Portal...</p>
        </div>
      </div>
    );
  }

  // 1.5. Set Username Screen (For new Google users)
  if (user && needsSetup) {
    return (
      <div className={`app${darkMode ? ' dark' : ''}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.08) 0%, transparent 60%)' }}>
          <div className="form-card" style={{ maxWidth: '400px', width: '100%', padding: '40px', textAlign: 'center' }}>
             <h2 className="hero__title" style={{ fontSize: '28px', marginBottom: '8px' }}>Setup Account</h2>
             <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Create a username and password to log in next time.</p>
             <form onSubmit={handleSetupAccount} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <input
                 type="text"
                 className="textarea"
                 style={{ height: 'auto', padding: '12px', textAlign: 'center' }}
                 placeholder="Username (e.g. johndoe_123)"
                 value={setupUsername}
                 onChange={(e) => setSetupUsername(e.target.value)}
                 required
               />
               <input
                 type="password"
                 className="textarea"
                 style={{ height: 'auto', padding: '12px', textAlign: 'center' }}
                 placeholder="Create a Password"
                 value={setupPassword}
                 onChange={(e) => setSetupPassword(e.target.value)}
                 required
               />
               {authError && <div className="error-banner">{authError}</div>}
               <button type="submit" className="btn-analyze">Complete Setup</button>
             </form>
          </div>
        </div>
      </div>
    );
  }

  // 2. Landing Page / Auth Login
  if (!user) {
    if (!showAuth) {
      return <LandingPage onSignIn={() => setShowAuth(true)} />;
    }

    return (
      <div className={`app${darkMode ? ' dark' : ''}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* NAV */}
        <nav className="nav">
          <div className="nav__brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={logoImg} alt="LuminaRole.ai Logo" className="nav__logo" onError={(e) => e.target.style.display='none'} fetchPriority="high" />
            <span>LuminaRole.ai</span>
          </div>
          <button className="nav__toggle" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle theme">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </nav>

        {/* AUTH CONTENT */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.08) 0%, transparent 60%)' }}>
          <div className="form-card" style={{ maxWidth: '440px', width: '100%', padding: '40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                <img src={logoImg} alt="LuminaRole.ai Logo" className="theme-logo" onError={(e) => e.target.style.display='none'} fetchPriority="high" style={{ height: '36px', marginRight: '-12px', marginTop: '2px' }} />
                <h2 className="hero__title" style={{ fontSize: '28px', marginBottom: 0, lineHeight: 1.2 }}>
                  Portal <span className="hero__accent">Login</span>
                </h2>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Register with Google, or log in if you have an account.
              </p>
            </div>

            {/* Primary Google Login Button */}
            <button className="btn-reset" onClick={handleGoogleLogin} disabled={authSubmitting} style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#fff', color: '#000', borderRadius: '12px', cursor: 'pointer', transition: '0.2s', fontSize: '15px', fontWeight: 600, marginBottom: '24px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.483 0-6.308-2.825-6.308-6.308s2.825-6.308 6.308-6.308c1.554 0 2.973.565 4.07 1.498l3.056-3.056C19.262 2.14 15.935 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.895 0 10.865-4.243 10.865-11.24 0-.763-.068-1.5-.2-1.955H12.24z"/>
              </svg>
              Continue with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ padding: '0 12px' }}>or log in with Username</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Username Field */}
              <div className="field">
                <label className="field__label">Username</label>
                <div style={{ position: 'relative' }}>
                  <UserPlus size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="textarea"
                    style={{ height: 'auto', padding: '12px 14px 12px 42px' }}
                    placeholder="johndoe123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="field">
                <label className="field__label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    className="textarea"
                    style={{ height: 'auto', padding: '12px 14px 12px 42px' }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {authError && <div className="error-banner" style={{ marginTop: '4px' }}>{authError}</div>}

              <button type="submit" className="btn-analyze" disabled={authSubmitting} style={{ marginTop: '8px' }}>
                {authSubmitting ? (
                  <><Loader2 className="spin" size={20} /> Logging in...</>
                ) : (
                  'Log In'
                )}
              </button>
            </form>
          </div>
        </div>

        <footer className="footer">© 2026 LuminaRole.ai — ML + AI Resume Intelligence</footer>
      </div>
    );
  }

  // 3. Authenticated Dashboard View
  return (
    <div className={`app${darkMode ? ' dark' : ''}`}>
      {/* NAV */}
      <nav className="nav">
        <div className="nav__brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={logoImg} alt="LuminaRole.ai Logo" className="nav__logo" onError={(e) => e.target.style.display='none'} fetchPriority="high" />
          <span>LuminaRole.ai</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }} className="hidden sm:inline">
            Logged in as <strong style={{ color: 'var(--text)' }}>{user.displayName || user.email}</strong>
          </span>
          <button className="nav__toggle" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle theme" style={{ marginRight: '4px' }}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="nav__toggle" onClick={handleLogout} aria-label="Log out" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}>
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <main className="main">
        {/* HERO */}
        <div className="hero hero-grid">
          <div className="hero-grid__logo">
            <img src={logoImg} alt="LuminaRole.ai Logo" className="theme-logo" onError={(e) => e.target.style.display='none'} fetchPriority="high" />
          </div>
          <div className="hero-grid__text">
            <h1 className="hero__title" style={{ marginBottom: '8px' }}>
              Resume <span className="hero__accent">Intelligence</span>
            </h1>
            <p className="hero__sub" style={{ margin: 0 }}>
              Analyse. Optimise.<br/>Succeed.
            </p>
          </div>
          <div className="hero-grid__empty"></div>
        </div>

        {!results ? (
          /* ---- FORM ---- */
          <form className="form-card" onSubmit={handleAnalyze}>
            {/* Upload */}
            <div className="field">
              <label className="field__label">Resume (PDF)</label>
              <div
                className={`dropzone${isDragging ? ' dropzone--drag' : ''}${file ? ' dropzone--ready' : ''}`}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" accept=".pdf" ref={fileInputRef} className="hidden" onChange={e => setFile(e.target.files[0])} />
                {file ? (
                  <div className="dropzone__ready">
                    <FileText size={40} />
                    <p className="dropzone__filename">{file.name}</p>
                    <p className="dropzone__size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="dropzone__idle">
                    <UploadCloud size={40} />
                    <p><span className="dropzone__cta">Click to upload</span> or drag & drop</p>
                    <p className="dropzone__hint">PDF up to 10MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* JD */}
            <div className="field">
              <label className="field__label">Job Description</label>
              <textarea
                className="textarea"
                rows={6}
                placeholder="Paste the full job description here..."
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              {/* Role Selector */}
              <div className="field" style={{ flex: 1 }}>
                <label className="field__label">Target Role</label>
                <select
                  className="textarea"
                  style={{ height: 'auto', padding: '12px' }}
                  value={role}
                  onChange={e => setRole(e.target.value)}
                >
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Country Selector */}
              <div className="field" style={{ flex: 1 }}>
                <label className="field__label">Location / Country</label>
                <select
                  className="textarea"
                  style={{ height: 'auto', padding: '12px' }}
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                >
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                </select>
              </div>

              {/* Experience Input */}
              <div className="field" style={{ flex: 1 }}>
                <label className="field__label">Total Experience</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="textarea"
                    style={{ height: 'auto', padding: '12px', flex: 1 }}
                    value={expValue}
                    onChange={e => setExpValue(e.target.value)}
                    required
                  />
                  <select
                    className="textarea"
                    style={{ height: 'auto', padding: '12px', width: '120px' }}
                    value={expUnit}
                    onChange={e => setExpUnit(e.target.value)}
                  >
                    <option value="Years">Years</option>
                    <option value="Months">Months</option>
                  </select>
                </div>
              </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <button type="submit" className="btn-analyze" disabled={isAnalyzing}>
              {isAnalyzing
                ? <><Loader2 className="spin" size={20} /> Analyzing Resume...</>
                : 'Run Analysis'}
            </button>
          </form>
        ) : (
          /* ---- RESULTS ---- */
          <div className="results">
            <div className="results__header">
              <h2 className="results__title">Analysis Complete</h2>
              <button className="btn-reset" onClick={reset}>Analyze Another →</button>
            </div>

            {/* TOP ROW: Score + Salary */}
            <div className="top-row">
              <div className="score-card">
                <p className="score-card__label">ATS Match Score</p>
                <ScoreRing score={results.ats_score} />
                <p className="score-card__sub">
                  {results.ats_score >= 70 ? 'Strong fit for this role'
                    : results.ats_score >= 45 ? 'Moderate fit — improvements needed'
                    : 'Low fit — significant gaps'}
                </p>
              </div>
              <div className="salary-card">
                <div className="salary-card__icon"><DollarSign size={22} /></div>
                <p className="salary-card__label">Predicted Market Salary</p>
                <p className="salary-card__value">{results.salary ? `$${results.salary.toLocaleString()}` : 'N/A'}</p>
                <p className="salary-card__sub">{results.salary ? 'Based on JD features & market data' : 'Model limited to DS or ML roles'}</p>
              </div>
            </div>

            {/* OVERALL ASSESSMENT */}
            {results.insights?.overall_assessment && (
              <div className="assessment-banner">
                <Star size={18} className="assessment-banner__icon" />
                <p>{results.insights.overall_assessment}</p>
              </div>
            )}

            {/* INSIGHT CARDS */}
            <div className="insights-grid">
              {/* Career Objective */}
              <InsightCard icon={Target} title="Career Objective Alignment" color="blue">
                <p className="insight-text"><strong>Alignment:</strong> {results.insights?.career_objective?.alignment}</p>
                <div className="insight-divider" />
                <p className="insight-text"><strong>Rewrite suggestion:</strong> {results.insights?.career_objective?.recommendation}</p>
              </InsightCard>

              {/* Experience */}
              <InsightCard icon={Briefcase} title="Experience Analysis" color="purple">
                <p className="insight-text"><strong>Relevance:</strong> {results.insights?.experience?.relevance}</p>
                <div className="insight-divider" />
                <p className="insight-text"><strong>How to reframe:</strong> {results.insights?.experience?.framing}</p>
              </InsightCard>

              {/* Strengths */}
              <InsightCard icon={TrendingUp} title="Key Strengths for This Role" color="green">
                <TagList items={results.insights?.strengths} variant="green" />
              </InsightCard>

              {/* Gaps */}
              <InsightCard icon={AlertTriangle} title="Identified Gaps" color="red">
                <TagList items={results.insights?.gaps} variant="red" />
              </InsightCard>

              {/* Action Items */}
              <InsightCard icon={Lightbulb} title="Action Items to Improve Your Resume" color="amber">
                <ActionList items={results.insights?.action_items} />
              </InsightCard>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">© 2026 ProfilePulse — ML + AI Resume Intelligence</footer>
    </div>
  );
}
