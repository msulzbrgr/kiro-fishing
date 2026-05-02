import { useRef, useState } from 'react';
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
  Camera,
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
  photos: string[];
}

const EMPTY_FORM: CatchFormState = {
  species: '',
  weight: '',
  length: '',
  released: true,
  notes: '',
  photos: [],
};

function isQuotaExceededError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const anyErr = err as { name?: unknown; message?: unknown; code?: unknown };
  if (anyErr.name === 'QuotaExceededError') return true;
  if (typeof anyErr.message === 'string' && anyErr.message.toLowerCase().includes('quota')) return true;
  return anyErr.code === 22 || anyErr.code === 1014;
}

export default function CatchLog({ session, onSessionUpdate }: CatchLogProps) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CatchFormState>(EMPTY_FORM);
  const [expandedCatch, setExpandedCatch] = useState<string | null>(null);
  const [activePhotoIndexByCatch, setActivePhotoIndexByCatch] = useState<Record<string, number>>({});
  const [galleryCatchId, setGalleryCatchId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_PHOTOS = 10;

  const closeGallery = () => setGalleryCatchId(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    if (form.photos.length >= MAX_PHOTOS) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

    const acceptedFiles = files
      .filter((file) => file.size <= MAX_BYTES)
      .slice(0, MAX_PHOTOS - form.photos.length);

    if (acceptedFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    let canceled = false;
    const readers: FileReader[] = [];

    const readFiles = async () => {
      const dataUrls: string[] = [];

      for (const file of acceptedFiles) {
        const dataUrl = await new Promise<string | null>((resolve) => {
          const reader = new FileReader();
          readers.push(reader);
          reader.onload = (ev) => {
            const result = ev.target?.result;
            resolve(typeof result === 'string' ? result : null);
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });

        if (canceled) return;
        if (dataUrl) dataUrls.push(dataUrl);
      }

      if (dataUrls.length > 0) {
        setForm((prev) => ({
          ...prev,
          photos: [...prev.photos, ...dataUrls].slice(0, MAX_PHOTOS),
        }));
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    void readFiles();

    return () => {
      canceled = true;
      readers.forEach((reader) => reader.readyState === reader.LOADING && reader.abort());
    };
  };

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
      photos: form.photos.length > 0 ? form.photos : undefined,
    };

    const updated: FishingSession = {
      ...session,
      catches: [...session.catches, newCatch],
    };

    try {
      saveSession(updated);
      setSaveError('');
      onSessionUpdate(updated);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      if (isQuotaExceededError(err)) {
        setSaveError(t('storage.quota_exceeded'));
        return;
      }
      throw err;
    }
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
          {saveError && (
            <div className="form-error" role="alert" data-testid="catch-save-error">
              {saveError}
            </div>
          )}
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

            <div className="form-group form-group-full">
              <label>
                <Camera size={14} /> {t('catch.photo_label')}
              </label>
              {form.photos.length > 0 ? (
                <div className="catch-photo-preview">
                  <div className="catch-photo-thumb-grid" data-testid="catch-photo-preview">
                    {form.photos.map((photo, idx) => (
                      <div key={idx} className="catch-photo-thumb-wrapper">
                        <img src={photo} alt="" className="catch-photo-thumb" />
                        <button
                          type="button"
                          className="btn btn-icon btn-danger catch-photo-thumb-remove"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              photos: prev.photos.filter((_, photoIdx) => photoIdx !== idx),
                            }));
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          aria-label={t('catch.remove_photo')}
                          title={t('catch.remove_photo')}
                          data-testid={`remove-photo-btn-${idx}`}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, photos: [] }));
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    data-testid="remove-all-photos-btn"
                  >
                    <X size={14} /> {t('catch.remove_photo')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm catch-photo-add-btn"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="add-photo-btn"
                >
                  <Camera size={14} /> {t('catch.add_photo')}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="catch-photo-input"
                onChange={handlePhotoChange}
                data-testid="catch-photo-input"
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
          (() => {
            const photos = c.photos ?? [];
            const activeIndex = Math.min(
              activePhotoIndexByCatch[c.id] ?? 0,
              Math.max(photos.length - 1, 0),
            );
            const activePhoto = photos[activeIndex];

            const setActiveIndex = (index: number) => {
              setActivePhotoIndexByCatch((prev) => ({
                ...prev,
                [c.id]: Math.min(Math.max(index, 0), Math.max(photos.length - 1, 0)),
              }));
            };

            return (
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
                  {photos.length > 0 && (
                    <span className="badge badge-photo">
                      <Camera size={11} />
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

            {expandedCatch === c.id && (
              <div className="catch-details">
                {photos.length > 0 && activePhoto && (
                  <div className="catch-photo-full-wrap">
                    <div className="catch-photo-inline-controls">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setActiveIndex(activeIndex - 1)}
                        disabled={activeIndex <= 0}
                        data-testid="catch-photo-prev"
                      >
                        ‹
                      </button>
                      <span className="catch-photo-counter" data-testid="catch-photo-counter">
                        {activeIndex + 1} / {photos.length}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setActiveIndex(activeIndex + 1)}
                        disabled={activeIndex >= photos.length - 1}
                        data-testid="catch-photo-next"
                      >
                        ›
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setGalleryCatchId(c.id)}
                        data-testid="catch-photo-gallery"
                      >
                        {t('catch.view_all_photos')}
                      </button>
                    </div>
                    <img
                      src={activePhoto}
                      alt={c.species}
                      className="catch-photo-full"
                      data-testid="catch-photo-full"
                      onClick={() => setGalleryCatchId(c.id)}
                    />
                  </div>
                )}
                {c.notes && <div className="catch-notes">{c.notes}</div>}
              </div>
            )}
          </div>
            );
          })()
        ))}
      </div>

      {galleryCatchId && (
        (() => {
          const catchEntry = session.catches.find((c) => c.id === galleryCatchId);
          const photos = catchEntry?.photos ?? [];
          const activeIndex = Math.min(
            activePhotoIndexByCatch[galleryCatchId] ?? 0,
            Math.max(photos.length - 1, 0),
          );
          const activePhoto = photos[activeIndex];

          const setActiveIndex = (index: number) => {
            setActivePhotoIndexByCatch((prev) => ({
              ...prev,
              [galleryCatchId]: Math.min(Math.max(index, 0), Math.max(photos.length - 1, 0)),
            }));
          };

          if (photos.length === 0 || !activePhoto) return null;

          return (
            <div
              className="modal-overlay"
              role="dialog"
              aria-modal="true"
              onClick={closeGallery}
              onKeyDown={(e) => {
                if (e.key === 'Escape') closeGallery();
                if (e.key === 'ArrowLeft') setActiveIndex(activeIndex - 1);
                if (e.key === 'ArrowRight') setActiveIndex(activeIndex + 1);
              }}
              tabIndex={-1}
              data-testid="catch-photo-modal"
            >
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>{t('catch.photos')}</h3>
                  <button
                    type="button"
                    className="btn btn-icon"
                    onClick={closeGallery}
                    aria-label={t('catch.close')}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="modal-body">
                  <div className="catch-photo-modal-main">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setActiveIndex(activeIndex - 1)}
                      disabled={activeIndex <= 0}
                      data-testid="catch-photo-modal-prev"
                    >
                      ‹
                    </button>
                    <img
                      src={activePhoto}
                      alt=""
                      className="catch-photo-modal-full"
                      data-testid="catch-photo-modal-full"
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setActiveIndex(activeIndex + 1)}
                      disabled={activeIndex >= photos.length - 1}
                      data-testid="catch-photo-modal-next"
                    >
                      ›
                    </button>
                  </div>

                  <div className="catch-photo-counter" data-testid="catch-photo-modal-counter">
                    {activeIndex + 1} / {photos.length}
                  </div>

                  <div className="catch-photo-modal-grid">
                    {photos.map((photo, idx) => (
                      <button
                        type="button"
                        key={idx}
                        className={`catch-photo-modal-thumb ${idx === activeIndex ? 'active' : ''}`}
                        onClick={() => setActiveIndex(idx)}
                      >
                        <img src={photo} alt="" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
