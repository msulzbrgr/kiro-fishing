import { useState, useCallback } from 'react';
import { Map, List, Plus, Fish } from 'lucide-react';
import type { FishingSession } from './types';
import { loadSessions, saveSession } from './utils/storage';
import MapView from './components/MapView';
import SessionList from './components/SessionList';
import NewSessionForm from './components/NewSessionForm';
import './App.css';

type Tab = 'map' | 'sessions' | 'new';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('sessions');
  const [sessions, setSessions] = useState<FishingSession[]>(loadSessions);

  const handleSessionCreated = useCallback((session: FishingSession) => {
    setSessions((prev) => [session, ...prev]);
    setActiveTab('sessions');
  }, []);

  const handleSessionUpdate = useCallback((session: FishingSession) => {
    saveSession(session);
    setSessions((prev) => prev.map((s) => (s.id === session.id ? session : s)));
  }, []);

  const handleSessionDelete = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <Fish size={28} className="brand-icon" />
            <div>
              <h1>KiroFishing</h1>
              <p>Your Swiss Fishing Companion</p>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        {activeTab === 'map' && (
          <div className="page">
            <div className="page-header">
              <h2>Fishing Laws by Location</h2>
              <p>Click on the map to see the fishing laws for that Swiss canton.</p>
            </div>
            <MapView />
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="page">
            <div className="page-header">
              <h2>Fishing Sessions</h2>
              <p>Track your fishing trips, conditions, and catches.</p>
            </div>
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
          className={`nav-item ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          <List size={22} />
          <span>Sessions</span>
        </button>
        <button
          className={`nav-item nav-item-center ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          <Plus size={26} />
          <span>New</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          <Map size={22} />
          <span>Laws</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
