import React from 'react';
import { ArrowRight, Search, MessageSquare, TrendingUp } from 'lucide-react';
import logoImg from '../assets/logo.webp';

export default function LandingPage({ onSignIn }) {
  return (
    <div className="landing-app">
      {/* ── NAV ── */}
      <nav className="landing-nav">
        <div className="landing-nav__brand">
          <img src={logoImg} alt="LuminaRole.ai Logo" className="landing-nav__logo" />
          <span>LuminaRole.ai</span>
        </div>
        <div className="landing-nav__links">
          <a href="#" className="landing-nav__link active">Home</a>
        </div>
        <div className="landing-nav__actions">
          <button className="btn-text" onClick={onSignIn}>Sign In</button>
          <button className="btn-primary" onClick={onSignIn}>
            Get Started <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      <main className="landing-main">
        {/* ── HERO ── */}
        <section className="landing-hero">
          <div className="hero-badge">
            <span className="hero-badge__dot"></span>
            Your Career Visibility Matters
          </div>
          <h1 className="landing-hero__title">
            Analyse. Optimise.<br/>
            <span className="text-blue">Succeed.</span>
          </h1>
          <p className="landing-hero__subtitle">
            Generic resumes rarely land on a recruiter's desk. Make your profile stand out, bypass Applicant Tracking Systems, and attract high-paying opportunities.
          </p>
          <button className="btn-primary btn-large" onClick={onSignIn}>
            Get Started <ArrowRight size={18} />
          </button>
        </section>

        {/* ── STATS SECTION ── */}
        <section className="landing-stats">
          <h2 className="landing-stats__title">The Impact of Profile Optimization</h2>
          <div className="stats-grid">
            
            {/* Card 1 */}
            <div className="stat-card">
              <div className="stat-card__header">
                <span className="stat-card__label">Increased Visibility</span>
                <div className="stat-card__icon blue-light"><Search size={18} /></div>
              </div>
              <div className="stat-card__value">47%</div>
              <p className="stat-card__desc">
                Higher appearance in recruiter searches compared to unoptimized resumes.
              </p>
              <div className="stat-badge success">↑ Above average</div>
            </div>

            {/* Card 2 */}
            <div className="stat-card">
              <div className="stat-card__header">
                <span className="stat-card__label">Recruiter Response Rate</span>
                <div className="stat-card__icon blue-light"><MessageSquare size={18} /></div>
              </div>
              <div className="stat-card__value">68%</div>
              <p className="stat-card__desc">
                Compared to just 24% for standard, non-tailored applications.
              </p>
              <div className="stat-badge success">! Above average</div>
            </div>

            {/* Card 3 */}
            <div className="stat-card">
              <div className="stat-card__header">
                <span className="stat-card__label">Job Opportunity Rate</span>
                <div className="stat-card__icon blue-light"><TrendingUp size={18} /></div>
              </div>
              <div className="stat-card__value">81%</div>
              <p className="stat-card__desc">
                Higher chance of receiving relevant and top-tier job opportunities.
              </p>
              <div className="stat-badge success">! Above average</div>
            </div>

          </div>
        </section>

        {/* ── ABOUT / DISCLAIMER SECTION ── */}
        <section className="landing-about" style={{ marginTop: '80px', padding: '40px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', maxWidth: '900px', margin: '80px auto 40px auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--text)' }}>About LuminaRole.ai</h2>
          <p style={{ color: 'var(--text-sub)', lineHeight: 1.6, fontSize: '1.05rem', maxWidth: '800px', margin: '0 auto' }}>
            LuminaRole.ai is an experimental platform built to help candidates align their profiles with specific job requirements. 
            <strong> Disclaimer:</strong> The underlying AI model is not trained to be strictly accurate or flawless. 
            The ATS scoring and feedback provided are estimations intended for advisory purposes only, and may occasionally exhibit inconsistencies. 
            Please use these insights as a helpful guide rather than definitive career advice.
          </p>
        </section>
      </main>
    </div>
  );
}
