import { useState, useCallback, useEffect } from 'react';
import { Map, List, Plus, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FishingSession } from './types';
import { loadSessions, saveSession } from './utils/storage';
import MapView from './components/MapView';
import SessionList from './components/SessionList';
import NewSessionForm from './components/NewSessionForm';
import LandingPage from './components/LandingPage';
import LanguageSwitcher from './components/LanguageSwitcher';
import DataManager from './components/DataManager';
import CantonOverview from './components/CantonOverview';
import logoApp from './assets/KiroFishingLogoApp.png';
import './App.css';

type Tab = 'home' | 'map' | 'sessions' | 'new';

function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [sessions, setSessions] = useState<FishingSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const refreshSessions = useCallback(async () => {
    try {
      setSessionsError(null);
      const loaded = await loadSessions();
      setSessions(loaded);
    } catch (err) {
      console.error('Failed to load sessions', err);
      setSessionsError('storage.load_failed');
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setSessionsError(null);
        const loaded = await loadSessions();
        if (!cancelled) {
          setSessions(loaded);
        }
      } catch (err) {
        console.error('Failed to load sessions', err);
        if (!cancelled) {
          setSessionsError('storage.load_failed');
        }
      } finally {
        if (!cancelled) {
          setSessionsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSessionCreated = useCallback((session: FishingSession) => {
    setSessions((prev) => [session, ...prev]);
    setActiveTab('sessions');
  }, []);

  const handleSessionUpdate = useCallback(async (session: FishingSession) => {
    const savedSession = await saveSession(session);
    setSessions((prev) => prev.map((s) => (s.id === savedSession.id ? savedSession : s)));
  }, []);

  const handleSessionDelete = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleImportSuccess = useCallback(async () => {
    await refreshSessions();
    setActiveTab('sessions');
  }, [refreshSessions]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <button
            className="header-brand"
            onClick={() => setActiveTab('home')}
            data-testid="header-brand"
          >
            <img src={logoApp} alt="KiroFishing" width="36" height="36" className="brand-img" />
          </button>
          <div className="header-right">
            <DataManager onImportSuccess={handleImportSuccess} />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="app-main">
        {activeTab === 'home' && (
          <LandingPage onGetStarted={() => setActiveTab('sessions')} />
        )}

        {activeTab === 'map' && (
          <div className="page">
            <div className="page-header">
              <h2>{t('map.laws_title')}</h2>
              <p>{t('map.click_instruction')}</p>
            </div>
            <MapView />
            <CantonOverview />
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="page">
            <div className="page-header">
              <h2>{t('sessions.title')}</h2>
              <p>{t('sessions.subtitle')}</p>
            </div>
            {sessionsLoading && <p>{t('sessions.loading')}</p>}
            {sessionsError && <p className="form-error">{t(sessionsError)}</p>}
            <SessionList
              sessions={sessions}
              onSessionUpdate={handleSessionUpdate}
              onSessionDelete={handleSessionDelete}
            />
          </div>
        )}

        {activeTab === 'new' && (
          <div className="page">
            <NewSessionForm
              onSessionCreated={handleSessionCreated}
              onCancel={() => setActiveTab('sessions')}
            />
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
          data-testid="nav-home"
        >
          <Home size={22} />
          <span>{t('nav.home')}</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
          data-testid="nav-sessions"
        >
          <List size={22} />
          <span>{t('nav.sessions')}</span>
        </button>
        <button
          className={`nav-item nav-item-center ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
          data-testid="nav-new"
        >
          <Plus size={26} />
          <span>{t('nav.new')}</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
          data-testid="nav-laws"
        >
          <Map size={22} />
          <span>{t('nav.laws')}</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
