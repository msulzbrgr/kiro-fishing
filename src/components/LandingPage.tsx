import { useTranslation } from 'react-i18next';
import { Map, Fish, List, Download } from 'lucide-react';
import logoHero from '../assets/KiroFishingLogo.png';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const { t } = useTranslation();

  return (
    <div className="landing">
      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-icon">
          <img src={logoHero} alt="KiroFishing" width="96" height="96" />
        </div>
        <h1 className="landing-hero-title">{t('landing.hero_title')}</h1>
        <p className="landing-hero-subtitle">{t('landing.hero_subtitle')}</p>
        <button
          className="btn btn-primary landing-cta"
          onClick={onGetStarted}
          data-testid="get-started-btn"
        >
          🎣 {t('landing.get_started')}
        </button>
      </section>

      {/* ── Features ── */}
      <section className="landing-features">
        <h2 className="landing-section-title">{t('landing.features_title')}</h2>

        <div className="feature-cards">
          <div className="feature-card">
            <div className="feature-icon feature-icon--green">
              <Map size={28} />
            </div>
            <h3>{t('landing.feature_laws_title')}</h3>
            <p>{t('landing.feature_laws_desc')}</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon feature-icon--blue">
              <List size={28} />
            </div>
            <h3>{t('landing.feature_sessions_title')}</h3>
            <p>{t('landing.feature_sessions_desc')}</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon feature-icon--teal">
              <Fish size={28} />
            </div>
            <h3>{t('landing.feature_catches_title')}</h3>
            <p>{t('landing.feature_catches_desc')}</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon feature-icon--amber">
              <Download size={28} />
            </div>
            <h3>{t('landing.feature_data_title')}</h3>
            <p>{t('landing.feature_data_desc')}</p>
          </div>
        </div>
      </section>

      {/* ── App Screenshots (CSS mockups) ── */}
      <section className="landing-screenshots">
        <h2 className="landing-section-title" data-testid="screenshots-heading">
          {t('landing.screenshot_map')} · {t('landing.screenshot_sessions')} ·{' '}
          {t('landing.screenshot_catches')}
        </h2>

        <div className="screenshots-grid">
          {/* Map mockup */}
          <div className="screenshot-card" data-testid="screenshot-map">
            <div className="screenshot-label">{t('landing.screenshot_map')}</div>
            <div className="mockup mockup--map">
              <div className="mockup-map-bg">
                <div className="mockup-map-grid">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="mockup-map-cell" />
                  ))}
                </div>
                <div className="mockup-pin">📍</div>
              </div>
              <div className="mockup-info-row">
                <span className="mockup-tag mockup-tag--green">{t('landing.mockup_canton_detected')}</span>
                <span className="mockup-tag mockup-tag--amber">{t('landing.mockup_permit')}</span>
              </div>
              <div className="mockup-hint">{t('landing.mockup_click_map')}</div>
            </div>
          </div>

          {/* Sessions mockup */}
          <div className="screenshot-card" data-testid="screenshot-sessions">
            <div className="screenshot-label">{t('landing.screenshot_sessions')}</div>
            <div className="mockup mockup--sessions">
              {[
                { date: t('landing.mockup_session_date'), catches: 3, icon: '☀️' },
                { date: '2026-04-18', catches: 1, icon: '🌧️' },
                { date: '2026-04-10', catches: 5, icon: '⛅' },
              ].map((s, i) => (
                <div key={i} className="mockup-session-row">
                  <span className="mockup-weather">{s.icon}</span>
                  <div className="mockup-session-info">
                    <strong>{s.date}</strong>
                    <span>
                      {s.catches} {t('landing.mockup_catches')}
                    </span>
                  </div>
                  <span className="mockup-chevron">›</span>
                </div>
              ))}
            </div>
          </div>

          {/* Catch log mockup */}
          <div className="screenshot-card" data-testid="screenshot-catches">
            <div className="screenshot-label">{t('landing.screenshot_catches')}</div>
            <div className="mockup mockup--catches">
              {[
                { species: t('landing.mockup_trout'), length: '38 cm', weight: '620 g', released: true },
                { species: 'Hecht (Pike)', length: '52 cm', weight: '1.4 kg', released: false },
                { species: 'Egli (Perch)', length: '22 cm', weight: '180 g', released: true },
              ].map((c, i) => (
                <div key={i} className="mockup-catch-row">
                  <span>🐟</span>
                  <div className="mockup-catch-info">
                    <strong>{c.species}</strong>
                    <span>
                      {c.length} · {c.weight}
                    </span>
                  </div>
                  {c.released && (
                    <span className="mockup-tag mockup-tag--blue">{t('landing.mockup_released')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Canton banner ── */}
      <section className="landing-cantons">
        <div className="cantons-badge">🇨🇭</div>
        <h3>{t('landing.cantons_title')}</h3>
        <p>{t('landing.cantons_desc')}</p>
        <div className="canton-chips">
          {['ZH', 'BE', 'LU', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR', 'SO', 'BS', 'BL',
            'SH', 'AR', 'AI', 'SG', 'GR', 'AG', 'TG', 'TI', 'VD', 'VS', 'NE', 'GE', 'JU', 'UR'].map((c) => (
            <span key={c} className="canton-chip">
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="landing-bottom-cta">
        <button className="btn btn-primary landing-cta" onClick={onGetStarted}>
          🎣 {t('landing.get_started')}
        </button>
      </section>
    </div>
  );
}
