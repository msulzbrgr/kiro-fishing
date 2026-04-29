import { useState } from 'react';
import {
  Calendar,
  MapPin,
  Fish,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  Cloud,
  Waves,
  CheckCircle,
  Circle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FishingSession } from '../types';
import { deleteSession } from '../utils/storage';
import CatchLog from './CatchLog';
import ConditionsForm from './ConditionsForm';
import MapView from './MapView';

interface SessionCardProps {
  session: FishingSession;
  onUpdate: (session: FishingSession) => void;
  onDelete: (id: string) => void;
}

function weatherEmoji(condition?: string) {
  switch (condition) {
    case 'sunny': return '☀️';
    case 'partly-cloudy': return '⛅';
    case 'cloudy': return '☁️';
    case 'rainy': return '🌧️';
    case 'stormy': return '⛈️';
    default: return '🌡️';
  }
}

function SessionCard({ session, onUpdate, onDelete }: SessionCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'catches' | 'conditions' | 'map'>('catches');

  const duration = session.endTime
    ? (() => {
        const [sh, sm] = session.startTime.split(':').map(Number);
        const [eh, em] = session.endTime.split(':').map(Number);
        const mins = (eh * 60 + em) - (sh * 60 + sm);
        if (mins < 0) return null;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
      })()
    : null;

  const catchCount = session.catches.length;
  const catchLabel = `${catchCount} ${catchCount === 1 ? t('sessions.catches_one') : t('sessions.catches_other')}`;

  return (
    <div className={`session-card card ${expanded ? 'expanded' : ''}`}>
      <div className="session-header" onClick={() => setExpanded(!expanded)}>
        <div className="session-info">
          <div className="session-date">
            <Calendar size={16} />
            <strong>{session.date}</strong>
            {session.endTime ? (
              <span className="badge badge-complete">
                <CheckCircle size={12} /> {t('sessions.complete')}
              </span>
            ) : (
              <span className="badge badge-active">
                <Circle size={12} /> {t('sessions.active')}
              </span>
            )}
          </div>
          <div className="session-meta">
            <span>
              <Clock size={14} /> {session.startTime}
              {session.endTime && ` – ${session.endTime}`}
              {duration && ` (${duration})`}
            </span>
            {session.location.locationName && (
              <span>
                <MapPin size={14} /> {session.location.locationName}
                {session.location.canton && ` · ${session.location.canton}`}
              </span>
            )}
            <span>
              <Fish size={14} /> {catchLabel}
            </span>
            {session.weather.condition && (
              <span>{weatherEmoji(session.weather.condition)} {session.weather.temperature}°C</span>
            )}
          </div>
        </div>
        <div className="session-actions">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {expanded && (
        <div className="session-body">
          <div className="tab-bar">
            <button
              className={`tab ${activeTab === 'catches' ? 'active' : ''}`}
              onClick={() => setActiveTab('catches')}
            >
              <Fish size={15} /> {t('sessions.tab_catches')}
            </button>
            <button
              className={`tab ${activeTab === 'conditions' ? 'active' : ''}`}
              onClick={() => setActiveTab('conditions')}
            >
              <Cloud size={15} /> {t('sessions.tab_conditions')}
            </button>
            <button
              className={`tab ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => setActiveTab('map')}
            >
              <MapPin size={15} /> {t('sessions.tab_map')}
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'catches' && (
              <CatchLog session={session} onSessionUpdate={onUpdate} />
            )}
            {activeTab === 'conditions' && (
              <ConditionsForm session={session} onSessionUpdate={onUpdate} />
            )}
            {activeTab === 'map' && (
              <MapView
                compact
                initialLocation={session.location}
              />
            )}
          </div>

          <div className="session-footer">
            {session.notes && <p className="session-notes">{session.notes}</p>}
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                if (confirm(t('sessions.delete_confirm'))) {
                  deleteSession(session.id);
                  onDelete(session.id);
                }
              }}
            >
              <Trash2 size={14} /> {t('sessions.delete')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface SessionListProps {
  sessions: FishingSession[];
  onSessionUpdate: (session: FishingSession) => void;
  onSessionDelete: (id: string) => void;
}

export default function SessionList({
  sessions,
  onSessionUpdate,
  onSessionDelete,
}: SessionListProps) {
  const { t } = useTranslation();

  if (sessions.length === 0) {
    return (
      <div className="empty-state-large">
        <Fish size={48} className="empty-icon" />
        <h3>{t('sessions.no_sessions')}</h3>
        <p>{t('sessions.no_sessions_desc')}</p>
      </div>
    );
  }

  return (
    <div className="session-list">
      {sessions.map((s) => (
        <SessionCard
          key={s.id}
          session={s}
          onUpdate={onSessionUpdate}
          onDelete={onSessionDelete}
        />
      ))}
    </div>
  );
}

// Also export the icons for potential use
export { Waves };
