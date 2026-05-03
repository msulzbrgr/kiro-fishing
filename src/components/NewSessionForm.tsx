import { useState } from 'react';
import { Play, Square, MapPin, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FishingSession, FishingLocation, RegulationReviewMode } from '../types';
import { CURRENT_SESSION_SCHEMA_VERSION } from '../types';
import { generateId, saveSession } from '../utils/storage';
import {
  createRegulationSnapshot,
  getRegulationStateAfterConfirmation,
} from '../utils/regulations';
import { getSafeExternalUrl } from '../utils/urls';
import MapView from './MapView';

interface NewSessionFormProps {
  onSessionCreated: (session: FishingSession) => void;
  onCancel: () => void;
}

export default function NewSessionForm({ onSessionCreated, onCancel }: NewSessionFormProps) {
  const { t } = useTranslation();
  const today = new Date().toLocaleDateString('sv-SE');
  const now = new Date().toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });

  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState(now);
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState<FishingLocation | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [reviewMode, setReviewMode] = useState<RegulationReviewMode>('information');
  const [regulationConfirmed, setRegulationConfirmed] = useState(false);
  const regulationSnapshot = location
    ? createRegulationSnapshot(location, regulationConfirmed, reviewMode)
    : null;
  const strictMode = reviewMode === 'strict';
  const canCreateSession = Boolean(
    location && regulationSnapshot && (!strictMode || regulationConfirmed),
  );
  const regulationSources = regulationSnapshot?.sourceUrls.map((url, index) => ({
    key: `${index}-${url}`,
    safeUrl: getSafeExternalUrl(url),
    title: regulationSnapshot.sourceTitles[index] ?? url,
  })) ?? [];

  const handleCreate = async () => {
    if (!location || !regulationSnapshot || !canCreateSession) return;

    const session: FishingSession = {
      schemaVersion: CURRENT_SESSION_SCHEMA_VERSION,
      id: generateId(),
      date,
      startTime,
      location,
      weather: {},
      water: {},
      catches: [],
      notes: notes.trim() || undefined,
      regulationSnapshot,
      regulationState: getRegulationStateAfterConfirmation(regulationSnapshot),
      regulationCheckpoints: [],
    };
    const savedSession = await saveSession(session);
    onSessionCreated(savedSession);
  };

  return (
    <div className="new-session-form card">
      <h2>
        <Play size={18} /> {t('new_session.title')}
      </h2>

      <div className="form-grid">
        <div className="form-group">
          <label>{t('new_session.date')}</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            data-testid="session-date"
          />
        </div>

        <div className="form-group">
          <label>{t('new_session.start_time')}</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            data-testid="session-time"
          />
        </div>

        <div className="form-group form-group-full">
          <label>
            <FileText size={14} /> {t('new_session.notes')}
          </label>
          <textarea
            placeholder={t('new_session.notes_placeholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      <div className="location-section">
        <button
          className="btn btn-secondary"
          onClick={() => setShowMap(!showMap)}
          data-testid="select-location-btn"
        >
          <MapPin size={16} />
          {location
            ? `📍 ${location.locationName ?? t('new_session.location_selected')}`
            : t('new_session.select_location')}
        </button>

        {location?.canton && (
          <span className="canton-badge">{location.canton}</span>
        )}
      </div>

      {showMap && (
        <MapView
          onLocationSelect={(loc) => {
            setLocation(loc);
            setRegulationConfirmed(false);
          }}
        />
      )}

      <div className="regulation-review" data-testid="regulation-review">
        <h3>{t('regulation.review_required_title')}</h3>
        <p>{location ? t('regulation.start_review_desc') : t('regulation.select_location_first')}</p>
        <label className="checkbox-label regulation-mode">
          <input
            type="checkbox"
            checked={strictMode}
            onChange={(e) => {
              setReviewMode(e.target.checked ? 'strict' : 'information');
              setRegulationConfirmed(false);
            }}
            data-testid="regulation-strict-mode-checkbox"
          />
          {t('regulation.strict_mode_label')}
        </label>
        <p className="regulation-mode-help">
          {strictMode ? t('regulation.strict_mode_desc') : t('regulation.information_mode_desc')}
        </p>
        <div className="regulation-status">
          <strong>{t('regulation.status_label')}:</strong>{' '}
          {t(`regulation.status_${regulationSnapshot?.status ?? 'missing'}`)}
        </div>
        {regulationSnapshot?.jurisdiction && (
          <div className="regulation-status">
            <strong>{t('regulation.jurisdiction')}:</strong> {regulationSnapshot.jurisdiction}
          </div>
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
            <p>{t('regulation.no_sources')}</p>
          )}
        </div>
        {strictMode && (
          <label className="checkbox-label regulation-confirm">
            <input
              type="checkbox"
              checked={regulationConfirmed}
              disabled={!location}
              onChange={(e) => setRegulationConfirmed(e.target.checked)}
              data-testid="regulation-confirm-checkbox"
            />
            {t('regulation.confirm_label')}
          </label>
        )}
      </div>

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onCancel} data-testid="cancel-session-btn">
          <Square size={16} /> {t('new_session.cancel')}
        </button>
        <button
          className="btn btn-primary"
          onClick={handleCreate}
          disabled={!canCreateSession}
          data-testid="create-session-btn"
        >
          <Play size={16} /> {t('new_session.create')}
        </button>
      </div>
    </div>
  );
}
