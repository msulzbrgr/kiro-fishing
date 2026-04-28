import { useState } from 'react';
import { Play, Square, MapPin, FileText } from 'lucide-react';
import type { FishingSession, FishingLocation } from '../types';
import { generateId, saveSession } from '../utils/storage';
import MapView from './MapView';

interface NewSessionFormProps {
  onSessionCreated: (session: FishingSession) => void;
  onCancel: () => void;
}

export default function NewSessionForm({ onSessionCreated, onCancel }: NewSessionFormProps) {
  const today = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD
  const now = new Date().toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });

  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState(now);
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState<FishingLocation | null>(null);
  const [showMap, setShowMap] = useState(false);

  const handleCreate = () => {
    const session: FishingSession = {
      id: generateId(),
      date,
      startTime,
      location: location ?? { lat: 0, lng: 0 },
      weather: {},
      water: {},
      catches: [],
      notes: notes.trim() || undefined,
    };
    saveSession(session);
    onSessionCreated(session);
  };

  return (
    <div className="new-session-form card">
      <h2>
        <Play size={18} /> Start New Fishing Session
      </h2>

      <div className="form-grid">
        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        <div className="form-group form-group-full">
          <label>
            <FileText size={14} /> Notes (optional)
          </label>
          <textarea
            placeholder="General notes about this fishing session…"
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
        >
          <MapPin size={16} />
          {location ? `📍 ${location.locationName ?? 'Location selected'}` : 'Select Location on Map'}
        </button>

        {location?.canton && (
          <span className="canton-badge">{location.canton}</span>
        )}
      </div>

      {showMap && (
        <MapView
          onLocationSelect={(loc) => {
            setLocation(loc);
          }}
        />
      )}

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onCancel}>
          <Square size={16} /> Cancel
        </button>
        <button className="btn btn-primary" onClick={handleCreate}>
          <Play size={16} /> Create Session
        </button>
      </div>
    </div>
  );
}
