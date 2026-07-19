import { useState } from 'react';
import {
  Calendar,
  MapPin,
  Fish,
  Clock,
  Camera,
  ChevronDown,
  ChevronUp,
  Trash2,
  Cloud,
  Waves,
  CheckCircle,
  Circle,
  AlertTriangle,
  ShieldCheck,
  StopCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FishingLocation, FishingSession, RegulationCheckpoint } from '../types';
import { deleteSession, saveSession } from '../utils/storage';
import { exportSessionStoryImages } from '../utils/storyImages';
import {
  createRegulationCheckpoint,
  createRegulationSnapshot,
  getRegulationChangeReason,
  getRegulationStateAfterConfirmation,
  isOutsideSwitzerland,
} from '../utils/regulations';
import { getSafeExternalUrl } from '../utils/urls';
import CatchLog from './CatchLog';
import ConditionsForm from './ConditionsForm';
import MapView from './MapView';
import RegulationResearchPrompt from './RegulationResearchPrompt';

interface SessionCardProps {
  session: FishingSession;
  onUpdate: (session: FishingSession) => Promise<void>;
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

function getPendingCheckpoint(session: FishingSession): RegulationCheckpoint | undefined {
  return [...(session.regulationCheckpoints ?? [])]
    .reverse()
    .find((checkpoint) => checkpoint.requiresConfirmation === true && !checkpoint.userConfirmed);
}

function getLatestInfoCheckpoint(session: FishingSession): RegulationCheckpoint | undefined {
  return [...(session.regulationCheckpoints ?? [])]
    .reverse()
    .find((checkpoint) => checkpoint.requiresConfirmation === false);
}

function SessionCard({ session, onUpdate, onDelete }: SessionCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'catches' | 'conditions' | 'map'>('catches');
  const [isStoryGenerating, setIsStoryGenerating] = useState(false);
  const pendingCheckpoint = getPendingCheckpoint(session);
  const latestInfoCheckpoint = getLatestInfoCheckpoint(session);
  const displayedCheckpoint = pendingCheckpoint ?? latestInfoCheckpoint;
  const regulationSnapshot = displayedCheckpoint?.newSnapshot
    ?? session.regulationSnapshot
    ?? createRegulationSnapshot(session.location);
  const regulationState = pendingCheckpoint
    ? 'paused_due_to_regulation_change'
    : session.regulationState ?? getRegulationStateAfterConfirmation(regulationSnapshot);
  const regulationSources = regulationSnapshot.sourceUrls.map((url, index) => ({
    key: `${index}-${url}`,
    safeUrl: getSafeExternalUrl(url),
    title: regulationSnapshot.sourceTitles[index] ?? url,
  }));
  const outsideSwitzerland = isOutsideSwitzerland(regulationSnapshot.location);

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

  const handleLocationSelect = async (nextLocation: FishingLocation) => {
    if (session.endTime) return;

    const previousSnapshot = session.regulationSnapshot ?? createRegulationSnapshot(session.location);
    if (!previousSnapshot.reviewMode) {
      console.warn('Regulation snapshot is missing reviewMode; defaulting to information mode.');
    }
    const newSnapshot = createRegulationSnapshot(
      nextLocation,
      false,
      previousSnapshot.reviewMode ?? 'information',
    );
    const reason = getRegulationChangeReason(previousSnapshot.location, nextLocation);

    if (!reason) {
      await onUpdate({ ...session, location: nextLocation });
      return;
    }

    const checkpoint = createRegulationCheckpoint(previousSnapshot, newSnapshot, reason);
    await onUpdate({
      ...session,
      location: nextLocation,
      regulationState: checkpoint.requiresConfirmation ? 'paused_due_to_regulation_change' : 'active_current',
      regulationCheckpoints: [...(session.regulationCheckpoints ?? []), checkpoint],
    });
  };

  const handleConfirmCheckpoint = async (checkpoint: RegulationCheckpoint) => {
    const confirmedSnapshot = {
      ...checkpoint.newSnapshot,
      userConfirmedUncertain: true,
      capturedAt: new Date().toISOString(),
    };
    const regulationCheckpoints = (session.regulationCheckpoints ?? []).map((item) =>
      item.id === checkpoint.id
        ? { ...item, newSnapshot: confirmedSnapshot, userConfirmed: true }
        : item,
    );

    await onUpdate({
      ...session,
      regulationSnapshot: confirmedSnapshot,
      regulationState: getRegulationStateAfterConfirmation(confirmedSnapshot),
      regulationCheckpoints,
    });
  };

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
            ) : regulationState === 'paused_due_to_regulation_change' || regulationState === 'active_needs_review' ? (
              <span className="badge badge-warning">
                <AlertTriangle size={12} /> {t('regulation.session_needs_review')}
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
          {(displayedCheckpoint || regulationState === 'active_confirmed_uncertain') && (
            <div
              className={`regulation-alert ${pendingCheckpoint ? 'regulation-alert-warning' : ''}`}
              data-testid="session-regulation-alert"
            >
              <h3>
                {pendingCheckpoint ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />}
                {pendingCheckpoint
                  ? t('regulation.change_notification_title')
                  : latestInfoCheckpoint
                    ? t('regulation.info_notification_title')
                  : t('regulation.confirmed_uncertain_title')}
              </h3>
              <p>
                {pendingCheckpoint
                  ? t('regulation.change_notification_desc')
                  : latestInfoCheckpoint
                    ? t('regulation.info_notification_desc')
                  : t('regulation.confirmed_uncertain_desc')}
              </p>
              {displayedCheckpoint && (
                <p className="regulation-change-meta">
                  {t('regulation.changed_from_to', {
                    from: displayedCheckpoint.previousJurisdiction ?? t('map.unknown_location'),
                    to: displayedCheckpoint.newJurisdiction ?? t('map.unknown_location'),
                  })}
                </p>
              )}
              <div className="source-list">
                <strong>{t('regulation.source_links')}:</strong>
                {regulationSources.length > 0 ? (
                  <ul>
                    {regulationSources.map((source) => (
                      <li key={source.key}>
                        {source.safeUrl ? (
                          <a href={source.safeUrl} target="_blank" rel="noopener noreferrer">
                            {source.title}
                          </a>
                        ) : (
                          <span>{source.title || t('regulation.invalid_source')}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>{t(outsideSwitzerland ? 'regulation.no_sources_outside_switzerland' : 'regulation.no_sources')}</p>
                )}
              </div>
              {pendingCheckpoint && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleConfirmCheckpoint(pendingCheckpoint)}
                  data-testid="confirm-regulation-change-btn"
                >
                  <ShieldCheck size={14} /> {t('regulation.confirm_change')}
                </button>
              )}
            </div>
          )}

          <RegulationResearchPrompt
            location={regulationSnapshot.location}
            dataTestId={`session-research-prompt-${session.id}`}
          />

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
                onLocationSelect={handleLocationSelect}
                catchMarkers={session.catches
                  .filter((c) => c.location != null)
                  .map((c) => ({
                    lat: c.location!.lat,
                    lng: c.location!.lng,
                    label: c.species,
                  }))}
              />
            )}
          </div>

          <div className="session-footer">
            {session.notes && <p className="session-notes">{session.notes}</p>}
            <div className="session-footer-actions">
              {!session.endTime && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={async () => {
                    const endTime = new Date().toLocaleTimeString('de-CH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const updated = { ...session, endTime };
                    const savedSession = await saveSession(updated);
                    await onUpdate(savedSession);
                  }}
                  data-testid="finish-session-btn"
                >
                  <StopCircle size={14} /> {t('sessions.finish')}
                </button>
              )}
              <button
                className="btn btn-secondary btn-sm"
                onClick={async () => {
                  setIsStoryGenerating(true);
                  try {
                    await exportSessionStoryImages(session, t);
                  } catch (err) {
                    console.error('Failed to generate session story images', err);
                  } finally {
                    setIsStoryGenerating(false);
                  }
                }}
                disabled={isStoryGenerating}
                data-testid={`create-story-btn-${session.id}`}
              >
                <Camera size={14} /> {t(isStoryGenerating ? 'sessions.creating_story' : 'sessions.create_story')}
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => {
                  if (confirm(t('sessions.delete_confirm'))) {
                    void deleteSession(session.id)
                      .then(() => onDelete(session.id))
                      .catch((err) => {
                        console.error('Failed to delete session', err);
                      });
                  }
                }}
              >
                <Trash2 size={14} /> {t('sessions.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SessionListProps {
  sessions: FishingSession[];
  onSessionUpdate: (session: FishingSession) => Promise<void>;
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
