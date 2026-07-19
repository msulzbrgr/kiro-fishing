import { useId, useState } from 'react';
import {
  Plus,
  Fish,
  X,
  Pencil,
  ChevronDown,
  ChevronUp,
  Ruler,
  Weight,
  Clock,
  RefreshCw,
  Camera,
  AlertTriangle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type {
  Catch,
  CatchRecognitionErrorCode,
  CatchSpeciesSelectionSource,
  FishingSession,
  SpeciesPrediction,
} from '../types';
import { COMMON_FISH_SPECIES } from '../data/cantonLaws';
import { generateId, saveSession } from '../utils/storage';
import {
  FISH_RECOGNITION_ENABLED,
  FISH_RECOGNITION_MODEL_VERSION,
  FishRecognitionError,
  identifyFishSpecies,
  isSupportedFishImage,
  MAX_FISH_RECOGNITION_IMAGE_BYTES,
} from '../services/fishRecognitionService';

interface CatchLogProps {
  session: FishingSession;
  onSessionUpdate: (session: FishingSession) => Promise<void>;
}

interface CatchFormState {
  species: string;
  selectedSpeciesSource: CatchSpeciesSelectionSource;
  weight: string;
  length: string;
  released: boolean;
  notes: string;
  photos: CatchPhotoFormEntry[];
}

interface CatchPhotoFormEntry {
  previewUrl: string;
  uploadDataUrl?: string;
  photoId?: string;
}

const DEFAULT_SPECIES_SOURCE: CatchSpeciesSelectionSource = 'manual';

const EMPTY_FORM: CatchFormState = {
  species: '',
  selectedSpeciesSource: DEFAULT_SPECIES_SOURCE,
  weight: '',
  length: '',
  released: true,
  notes: '',
  photos: [],
};

function createFormStateFromCatch(catchEntry: Catch): CatchFormState {
  const previewPhotos = catchEntry.photos ?? [];
  if (catchEntry.photoIds && previewPhotos.length > 0 && catchEntry.photoIds.length !== previewPhotos.length) {
    console.warn('Catch photo preview count does not match persisted photo ids.', {
      catchId: catchEntry.id,
      photoIds: catchEntry.photoIds.length,
      previews: previewPhotos.length,
    });
  }

  const persistedPhotos = (catchEntry.photoIds ?? []).map((photoId, index) => ({
    photoId,
    previewUrl: previewPhotos[index] ?? '',
  }));

  const newPhotos = previewPhotos
    .slice(persistedPhotos.length)
    .map((previewUrl) => ({
      previewUrl,
      uploadDataUrl: previewUrl,
    }));

  return {
    species: catchEntry.species,
    selectedSpeciesSource: catchEntry.recognition?.selectedSpeciesSource ?? DEFAULT_SPECIES_SOURCE,
    weight: catchEntry.weight?.toString() ?? '',
    length: catchEntry.length?.toString() ?? '',
    released: catchEntry.released,
    notes: catchEntry.notes ?? '',
    photos: [...persistedPhotos, ...newPhotos],
  };
}

type RecognitionState = 'idle' | 'processing' | 'success' | 'low_confidence' | 'failed';

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
  const [editingCatchId, setEditingCatchId] = useState<string | null>(null);
  const [expandedCatch, setExpandedCatch] = useState<string | null>(null);
  const [activePhotoIndexByCatch, setActivePhotoIndexByCatch] = useState<Record<string, number>>({});
  const [galleryCatchId, setGalleryCatchId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string>('');
  const [photoValidationError, setPhotoValidationError] = useState<string>('');
  const [recognitionState, setRecognitionState] = useState<RecognitionState>('idle');
  const [recognitionAttempted, setRecognitionAttempted] = useState(false);
  const [recognitionCandidates, setRecognitionCandidates] = useState<SpeciesPrediction[]>([]);
  const [recognitionModelVersion, setRecognitionModelVersion] = useState('');
  const [recognizedAt, setRecognizedAt] = useState('');
  const [recognitionErrorCode, setRecognitionErrorCode] = useState<CatchRecognitionErrorCode | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const photoInputId = useId();

  const MAX_PHOTOS = 10;
  const MAX_BYTES = 5 * 1024 * 1024;
  const LOW_CONFIDENCE_THRESHOLD = 0.6;

  const closeGallery = () => setGalleryCatchId(null);
  const clearFileInput = () => {
    setFileInputKey((prev) => prev + 1);
  };
  const openPhotoPicker = () => {
    document.getElementById(photoInputId)?.click();
  };

  const resetFormState = () => {
    setEditingCatchId(null);
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSaveError('');
    setPhotoValidationError('');
    resetRecognition();
    clearFileInput();
  };

  const resetRecognition = () => {
    setRecognitionState('idle');
    setRecognitionAttempted(false);
    setRecognitionCandidates([]);
    setRecognitionModelVersion('');
    setRecognizedAt('');
    setRecognitionErrorCode(null);
  };

  const startNewCatch = () => {
    setEditingCatchId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setSaveError('');
    setPhotoValidationError('');
    resetRecognition();
    clearFileInput();
  };

  const startEditingCatch = (catchEntry: Catch) => {
    setEditingCatchId(catchEntry.id);
    setForm(createFormStateFromCatch(catchEntry));
    setShowForm(true);
    setSaveError('');
    setPhotoValidationError('');
    resetRecognition();
    clearFileInput();
  };

  const getRecognitionErrorMessage = (code: CatchRecognitionErrorCode): string => {
    switch (code) {
      case 'unsupported_format':
        return t('catch.recognition.error_unsupported_format');
      case 'image_too_large':
        return t('catch.recognition.error_image_too_large');
      case 'malformed_image':
        return t('catch.recognition.error_malformed_image');
      case 'out_of_memory':
        return t('catch.recognition.error_out_of_memory');
      default:
        return t('catch.recognition.error_processing_failed');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    if (form.photos.length >= MAX_PHOTOS) {
      clearFileInput();
      return;
    }

    const acceptedFiles = files
      .filter((file) => {
        const isSupported = FISH_RECOGNITION_ENABLED
          ? isSupportedFishImage(file)
          : file.type.startsWith('image/');
        const maxBytes = FISH_RECOGNITION_ENABLED
          ? MAX_FISH_RECOGNITION_IMAGE_BYTES
          : MAX_BYTES;
        return isSupported && file.size <= maxBytes;
      })
      .slice(0, MAX_PHOTOS - form.photos.length);

    if (acceptedFiles.length === 0) {
      if (FISH_RECOGNITION_ENABLED) {
        const hasUnsupported = files.some((file) => !isSupportedFishImage(file));
        const hasOversized = files.some((file) => file.size > MAX_FISH_RECOGNITION_IMAGE_BYTES);
        if (hasUnsupported) {
          setPhotoValidationError(t('catch.recognition.error_unsupported_format'));
        } else if (hasOversized) {
          setPhotoValidationError(t('catch.recognition.error_image_too_large'));
        }
      }
      clearFileInput();
      return;
    }
    setPhotoValidationError('');

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
          photos: [
            ...prev.photos,
            ...dataUrls.map((previewUrl) => ({
              previewUrl,
              uploadDataUrl: previewUrl,
            })),
          ].slice(0, MAX_PHOTOS),
        }));
      }

      const primaryFile = acceptedFiles[0];
      if (FISH_RECOGNITION_ENABLED && primaryFile) {
        setRecognitionState('processing');
        setRecognitionAttempted(true);
        setRecognitionErrorCode(null);
        try {
          const result = await identifyFishSpecies({ file: primaryFile });
          setRecognitionCandidates(result.predictions);
          setRecognitionModelVersion(result.modelVersion);
          setRecognizedAt(result.recognizedAt);
          const topCandidate = result.predictions[0];
          if (topCandidate) {
            setForm((prev) => ({
              ...prev,
              species: topCandidate.species,
              selectedSpeciesSource: 'ai',
            }));
            setRecognitionState(
              topCandidate.confidence < LOW_CONFIDENCE_THRESHOLD ? 'low_confidence' : 'success',
            );
          } else {
            setRecognitionState('failed');
            setRecognitionErrorCode('processing_failed');
          }
        } catch (err) {
          const code = err instanceof FishRecognitionError ? err.code : 'processing_failed';
          setRecognitionCandidates([]);
          setRecognitionModelVersion(FISH_RECOGNITION_MODEL_VERSION);
          setRecognizedAt(new Date().toISOString());
          setRecognitionState('failed');
          setRecognitionErrorCode(code);
        }
      }

      clearFileInput();
    };

    void readFiles();

    return () => {
      canceled = true;
      readers.forEach((reader) => reader.readyState === reader.LOADING && reader.abort());
    };
  };

  const buildRecognitionForSave = (existingCatch?: Catch) => {
    const existingRecognition = existingCatch?.recognition;

    if (FISH_RECOGNITION_ENABLED && recognitionAttempted) {
      return {
        predictedSpecies: recognitionCandidates,
        selectedSpeciesSource: form.selectedSpeciesSource,
        selectedSpeciesConfidence: recognitionCandidates.find((p) => p.species === form.species)?.confidence,
        modelVersion: recognitionModelVersion || FISH_RECOGNITION_MODEL_VERSION,
        recognizedAt: recognizedAt || new Date().toISOString(),
        errorCode: recognitionState === 'failed' ? recognitionErrorCode ?? 'processing_failed' : undefined,
      };
    }

    if (!existingRecognition) return undefined;

    return {
      ...existingRecognition,
      selectedSpeciesSource: form.selectedSpeciesSource,
      selectedSpeciesConfidence: existingRecognition.predictedSpecies.find((p) => p.species === form.species)?.confidence,
    };
  };

  const handleSaveCatch = async () => {
    if (!form.species.trim()) return;

    const existingCatch = editingCatchId
      ? session.catches.find((catchEntry) => catchEntry.id === editingCatchId)
      : undefined;
    const persistedPhotoIds = form.photos
      .flatMap((photo) => (photo.photoId ? [photo.photoId] : []));
    const newPhotos = form.photos
      .flatMap((photo) => (photo.uploadDataUrl ? [photo.uploadDataUrl] : []));

    const nextCatch: Catch = {
      id: existingCatch?.id ?? generateId(),
      species: form.species,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      length: form.length ? parseFloat(form.length) : undefined,
      time: existingCatch?.time ?? new Date().toLocaleTimeString('de-CH', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      released: form.released,
      notes: form.notes.trim() || undefined,
      photoIds: persistedPhotoIds.length > 0 ? persistedPhotoIds : undefined,
      photos: newPhotos.length > 0 ? newPhotos : undefined,
      recognition: buildRecognitionForSave(existingCatch),
    };

    const updated: FishingSession = {
      ...session,
      catches: existingCatch
        ? session.catches.map((catchEntry) => (catchEntry.id === existingCatch.id ? nextCatch : catchEntry))
        : [...session.catches, nextCatch],
    };

    try {
      const savedSession = await saveSession(updated);
      setSaveError('');
      setPhotoValidationError('');
      await onSessionUpdate(savedSession);
      resetFormState();
    } catch (err) {
      if (isQuotaExceededError(err)) {
        setSaveError(t('storage.quota_exceeded'));
        return;
      }
      throw err;
    }
  };

  const handleDeleteCatch = async (id: string) => {
    const updated: FishingSession = {
      ...session,
      catches: session.catches.filter((c) => c.id !== id),
    };
    const savedSession = await saveSession(updated);
    await onSessionUpdate(savedSession);
  };

  return (
    <div className="catch-log">
      <div className="section-header">
        <h3>
          <Fish size={18} /> {t('catch.title')} ({session.catches.length})
        </h3>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            if (showForm) {
              resetFormState();
              return;
            }
            startNewCatch();
          }}
          data-testid="log-catch-btn"
        >
          <Plus size={16} /> {t('catch.log_catch')}
        </button>
      </div>

      {showForm && (
        <div className="catch-form card">
          <h4>{t(editingCatchId ? 'catch.edit_catch' : 'catch.new_catch')}</h4>
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
                onChange={(e) => setForm({ ...form, species: e.target.value, selectedSpeciesSource: 'manual' })}
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
              {photoValidationError && (
                <div className="form-error" role="alert" data-testid="catch-photo-error">
                  {photoValidationError}
                </div>
              )}
              {form.photos.some((photo) => photo.previewUrl) ? (
                <div className="catch-photo-preview">
                  <div className="catch-photo-thumb-grid" data-testid="catch-photo-preview">
                    {form.photos.map((photo, idx) => (
                      photo.previewUrl ? (
                      <div key={idx} className="catch-photo-thumb-wrapper">
                        <img src={photo.previewUrl} alt="" className="catch-photo-thumb" />
                        <button
                          type="button"
                          className="btn btn-icon btn-danger catch-photo-thumb-remove"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              photos: prev.photos.filter((_, photoIdx) => photoIdx !== idx),
                            }));
                            clearFileInput();
                          }}
                          aria-label={t('catch.remove_photo')}
                          title={t('catch.remove_photo')}
                          data-testid={`remove-photo-btn-${idx}`}
                        >
                          <X size={12} />
                        </button>
                      </div>
                      ) : null
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, photos: [] }));
                      clearFileInput();
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
                  onClick={openPhotoPicker}
                  data-testid="add-photo-btn"
                >
                  <Camera size={14} /> {t('catch.add_photo')}
                </button>
              )}
              <input
                key={fileInputKey}
                id={photoInputId}
                type="file"
                accept={FISH_RECOGNITION_ENABLED ? 'image/jpeg,image/png,image/webp' : 'image/*'}
                multiple
                className="catch-photo-input"
                onChange={handlePhotoChange}
                data-testid="catch-photo-input"
              />
              {FISH_RECOGNITION_ENABLED && recognitionState === 'processing' && (
                <div className="catch-recognition-status" data-testid="catch-recognition-processing">
                  <RefreshCw size={14} className="spin" /> {t('catch.recognition.processing')}
                </div>
              )}
              {FISH_RECOGNITION_ENABLED
                && (recognitionState === 'success' || recognitionState === 'low_confidence') && (
                <div className="catch-recognition-status" data-testid="catch-recognition-status">
                  <div className="catch-recognition-title">
                    {recognitionState === 'low_confidence'
                      ? t('catch.recognition.low_confidence')
                      : t('catch.recognition.suggestions_title')}
                  </div>
                  <div className="catch-recognition-suggestions">
                    {recognitionCandidates.map((candidate, index) => (
                      <button
                        key={`${candidate.species}-${index}`}
                        type="button"
                        className={`pill ${form.species === candidate.species ? 'active' : ''}`}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            species: candidate.species,
                            selectedSpeciesSource: 'manual',
                          }))}
                        data-testid={`catch-recognition-suggestion-${index}`}
                      >
                        {candidate.species} ({Math.round(candidate.confidence * 100)}%)
                      </button>
                    ))}
                  </div>
                  <div className="settings-hint">{t('catch.recognition.override_hint')}</div>
                </div>
              )}
              {FISH_RECOGNITION_ENABLED && recognitionState === 'failed' && recognitionErrorCode && (
                <div className="form-error" role="alert" data-testid="catch-recognition-error">
                  <AlertTriangle size={14} /> {getRecognitionErrorMessage(recognitionErrorCode)}
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              className="btn btn-secondary"
              onClick={resetFormState}
            >
              {t('catch.cancel')}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveCatch}
              disabled={!form.species}
              data-testid="add-catch-btn"
            >
              {t(editingCatchId ? 'catch.save' : 'catch.add')}
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
                  className="btn btn-icon btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditingCatch(c);
                  }}
                  title={t('catch.edit_title')}
                  aria-label={t('catch.edit_title')}
                  data-testid={`edit-catch-btn-${c.id}`}
                >
                  <Pencil size={14} />
                </button>
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
