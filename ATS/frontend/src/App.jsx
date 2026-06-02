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
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';

import ScoreRing from './components/ScoreRing';
import InsightCard from './components/InsightCard';
import TagList from './components/TagList';
import ActionList from './components/ActionList';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function App() {
  const [darkMode, setDarkMode]           = useState(true);
  const [file, setFile]                   = useState(null);
  const [isDragging, setIsDragging]       = useState(false);
  const [jobDescription, setJobDescription] = useState('');
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
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [isSignUp, setIsSignUp]           = useState(false);
  const [authError, setAuthError]         = useState(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

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

  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') setFile(f);
    else alert('Please upload a PDF file.');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setAuthError('Please fill in all fields.');
      return;
    }
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      let cleanMsg = err.message;
      if (err.code === 'auth/invalid-credential') cleanMsg = 'Invalid email or password.';
      else if (err.code === 'auth/weak-password') cleanMsg = 'Password should be at least 6 characters.';
      else if (err.code === 'auth/email-already-in-use') cleanMsg = 'This email is already in use.';
      else if (err.code === 'auth/invalid-email') cleanMsg = 'Please enter a valid email address.';
      setAuthError(cleanMsg);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthSubmitting(true);
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      setAuthError(err.message);
    } finally {
      setAuthSubmitting(false);
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

  const reset = () => { setFile(null); setJobDescription(''); setCountry('United States'); setExpValue(0); setExpUnit('Years'); setResults(null); setError(null); };

  // 1. Loading Screen
  if (authLoading) {
    return (
      <div className="auth-fullscreen-loader">
        <Loader2 className="spin text-accent" size={48} />
        <p>Loading Intelligence Portal...</p>
      </div>
    );
  }

  // 2. Auth Login/Register View
  if (!user) {
    return (
      <div className={`app${darkMode ? ' dark' : ''}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* NAV */}
        <nav className="nav">
          <div className="nav__brand">
            <div className="nav__dot" />
            <span>ProfilePulse</span>
          </div>
          <button className="nav__toggle" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle theme">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </nav>

        {/* AUTH CONTENT */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.08) 0%, transparent 60%)' }}>
          <div className="form-card" style={{ maxWidth: '440px', width: '100%', padding: '40px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(37,99,235,0.1)', borderRadius: '14px', color: '#2563eb', marginBottom: '16px' }}>
                {isSignUp ? <UserPlus size={28} /> : <LogIn size={28} />}
              </div>
              <h2 className="hero__title" style={{ fontSize: '28px', marginBottom: '8px', lineHeight: 1.2 }}>
                {isSignUp ? 'Create' : 'Portal'} <span className="hero__accent">{isSignUp ? 'Account' : 'Login'}</span>
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                {isSignUp ? 'Register to start analyzing professional profiles' : 'Enter your credentials to access ATS tools'}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Email */}
              <div className="field">
                <label className="field__label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    className="textarea"
                    style={{ height: 'auto', padding: '12px 14px 12px 42px' }}
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  <><Loader2 className="spin" size={20} /> Connecting...</>
                ) : (
                  isSignUp ? 'Sign Up' : 'Sign In'
                )}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ padding: '0 12px' }}>or continue with</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Google Sign In */}
            <button className="btn-reset" onClick={handleGoogleLogin} disabled={authSubmitting} style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', cursor: 'pointer', transition: '0.2s', fontSize: '14px', fontWeight: 500 }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.483 0-6.308-2.825-6.308-6.308s2.825-6.308 6.308-6.308c1.554 0 2.973.565 4.07 1.498l3.056-3.056C19.262 2.14 15.935 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.895 0 10.865-4.243 10.865-11.24 0-.763-.068-1.5-.2-1.955H12.24z"/>
              </svg>
              Google Account
            </button>

            <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '14px', color: 'var(--text-muted)' }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setAuthError(null); }}
                style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 500, padding: 0 }}
              >
                {isSignUp ? 'Sign In' : 'Register Now'}
              </button>
            </div>
          </div>
        </div>

        <footer className="footer">© 2026 ProfilePulse — ML + AI Resume Intelligence</footer>
      </div>
    );
  }

  // 3. Authenticated Dashboard View
  return (
    <div className={`app${darkMode ? ' dark' : ''}`}>
      {/* NAV */}
      <nav className="nav">
        <div className="nav__brand">
          <div className="nav__dot" />
          <span>ProfilePulse</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }} className="hidden sm:inline">
            Logged in as <strong style={{ color: 'var(--text)' }}>{user.email}</strong>
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
        <div className="hero">
          <h1 className="hero__title">
            Resume <span className="hero__accent">Intelligence</span>
          </h1>
          <p className="hero__sub">
            ML-powered ATS scoring + AI qualitative coaching in one pipeline
          </p>
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
                <p className="salary-card__value">${results.salary?.toLocaleString()}</p>
                <p className="salary-card__sub">Based on JD features & market data</p>
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
