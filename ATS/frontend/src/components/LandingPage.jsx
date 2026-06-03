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
            Analyse. Optimise. <span className="hero-highlight">Succeed.</span>
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
      </main>
    </div>
  );
}
