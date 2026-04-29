import { useState } from 'react';
import {
  Plus,
  Fish,
  X,
  ChevronDown,
  ChevronUp,
  Ruler,
  Weight,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Catch, FishingSession } from '../types';
import { COMMON_FISH_SPECIES } from '../data/cantonLaws';
import { generateId, saveSession } from '../utils/storage';

interface CatchLogProps {
  session: FishingSession;
  onSessionUpdate: (session: FishingSession) => void;
}

interface CatchFormState {
  species: string;
  weight: string;
  length: string;
  released: boolean;
  notes: string;
}

const EMPTY_FORM: CatchFormState = {
  species: '',
  weight: '',
  length: '',
  released: true,
  notes: '',
};

export default function CatchLog({ session, onSessionUpdate }: CatchLogProps) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CatchFormState>(EMPTY_FORM);
  const [expandedCatch, setExpandedCatch] = useState<string | null>(null);

  const handleAddCatch = () => {
    if (!form.species.trim()) return;

    const newCatch: Catch = {
      id: generateId(),
      species: form.species,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      length: form.length ? parseFloat(form.length) : undefined,
      time: new Date().toLocaleTimeString('de-CH', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      released: form.released,
      notes: form.notes.trim() || undefined,
    };

    const updated: FishingSession = {
      ...session,
      catches: [...session.catches, newCatch],
    };

    saveSession(updated);
    onSessionUpdate(updated);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const handleDeleteCatch = (id: string) => {
    const updated: FishingSession = {
      ...session,
      catches: session.catches.filter((c) => c.id !== id),
    };
    saveSession(updated);
    onSessionUpdate(updated);
  };

  return (
    <div className="catch-log">
      <div className="section-header">
        <h3>
          <Fish size={18} /> {t('catch.title')} ({session.catches.length})
        </h3>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowForm(!showForm)}
          data-testid="log-catch-btn"
        >
          <Plus size={16} /> {t('catch.log_catch')}
        </button>
      </div>

      {showForm && (
        <div className="catch-form card">
          <h4>{t('catch.new_catch')}</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>{t('catch.species')}</label>
              <select
                value={form.species}
                onChange={(e) => setForm({ ...form, species: e.target.value })}
                data-testid="species-select"
              >
                <option value="">{t('catch.select_species')}</option>
                {COMMON_FISH_SPECIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                <Ruler size={14} /> {t('catch.length_label')}
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder={t('catch.length_placeholder')}
                value={form.length}
                onChange={(e) => setForm({ ...form, length: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>
                <Weight size={14} /> {t('catch.weight_label')}
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder={t('catch.weight_placeholder')}
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.released}
                  onChange={(e) => setForm({ ...form, released: e.target.checked })}
                />
                <RefreshCw size={14} /> {t('catch.released')}
              </label>
            </div>

            <div className="form-group form-group-full">
              <label>{t('catch.notes')}</label>
              <textarea
                placeholder={t('catch.notes_placeholder')}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowForm(false);
                setForm(EMPTY_FORM);
              }}
            >
              {t('catch.cancel')}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAddCatch}
              disabled={!form.species}
              data-testid="add-catch-btn"
            >
              {t('catch.add')}
            </button>
          </div>
        </div>
      )}

      {session.catches.length === 0 && !showForm && (
        <p className="empty-state">{t('catch.no_catches')}</p>
      )}

      <div className="catches-list">
        {session.catches.map((c) => (
          <div key={c.id} className="catch-item card">
            <div
              className="catch-header"
              onClick={() => setExpandedCatch(expandedCatch === c.id ? null : c.id)}
            >
              <div className="catch-summary">
                <span className="catch-species">🐟 {c.species}</span>
                <div className="catch-meta">
                  {c.length && (
                    <span>
                      <Ruler size={12} /> {c.length} cm
                    </span>
                  )}
                  {c.weight && (
                    <span>
                      <Weight size={12} /> {c.weight} g
                    </span>
                  )}
                  <span>
                    <Clock size={12} /> {c.time}
                  </span>
                  {c.released && (
                    <span className="badge badge-released">
                      <RefreshCw size={11} /> {t('catch.released')}
                    </span>
                  )}
                </div>
              </div>
              <div className="catch-actions">
                <button
                  className="btn btn-icon btn-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCatch(c.id);
                  }}
                  title={t('catch.delete_title')}
                >
                  <X size={14} />
                </button>
                {expandedCatch === c.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {expandedCatch === c.id && c.notes && (
              <div className="catch-notes">{c.notes}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
