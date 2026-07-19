import { useId, useState } from 'react';
import { Plus, Pencil, X, User, Fish, ArrowLeft, Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Catch, FishingSession, Profile } from '../types';
import { deleteProfile, generateId, saveProfile } from '../utils/storage';

interface ProfilesViewProps {
  profiles: Profile[];
  sessions: FishingSession[];
  onProfilesChange: () => Promise<void>;
}

interface ProfileFormState {
  nickname: string;
  photoDataUrl: string | null;
  previewUrl: string;
}

const EMPTY_FORM: ProfileFormState = {
  nickname: '',
  photoDataUrl: null,
  previewUrl: '',
};

interface CatchWithSession {
  catch: Catch;
  session: FishingSession;
}

function ProfileAvatar({ profile, size = 40 }: { profile: Profile; size?: number }) {
  if (profile.photo) {
    return (
      <img
        src={profile.photo}
        alt={profile.nickname}
        className="profile-avatar-img"
        style={{ width: size, height: size }}
        data-testid={`profile-avatar-${profile.id}`}
      />
    );
  }
  return (
    <div
      className="profile-avatar-placeholder"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      data-testid={`profile-avatar-placeholder-${profile.id}`}
    >
      {profile.nickname.charAt(0).toUpperCase() || <User size={size * 0.5} />}
    </div>
  );
}

export { ProfileAvatar };

export default function ProfilesView({ profiles, sessions, onProfilesChange }: ProfilesViewProps) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileFormState>(EMPTY_FORM);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [filterSpecies, setFilterSpecies] = useState('');
  const [filterSessionId, setFilterSessionId] = useState('');
  const [saving, setSaving] = useState(false);
  const photoInputId = useId();

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId) ?? null;

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const startNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const startEdit = (profile: Profile) => {
    setEditingId(profile.id);
    setForm({
      nickname: profile.nickname,
      photoDataUrl: null,
      previewUrl: profile.photo ?? '',
    });
    setShowForm(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setForm((prev) => ({ ...prev, photoDataUrl: dataUrl, previewUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setForm((prev) => ({ ...prev, photoDataUrl: null, previewUrl: '' }));
  };

  const handleSave = async () => {
    if (!form.nickname.trim()) return;
    setSaving(true);
    try {
      const id = editingId ?? generateId();
      const profile: Profile = { id, nickname: form.nickname.trim() };
      const photoArg = form.photoDataUrl !== null
        ? form.photoDataUrl || null
        : form.previewUrl
          ? undefined
          : null;
      await saveProfile(profile, photoArg as string | null | undefined);
      await onProfilesChange();
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('profiles.delete_confirm'))) return;
    await deleteProfile(id);
    if (selectedProfileId === id) setSelectedProfileId(null);
    await onProfilesChange();
  };

  // Detail view: all catches for the selected profile
  const catchesForProfile: CatchWithSession[] = sessions.flatMap((session) =>
    session.catches
      .filter((c) => c.profileId === selectedProfileId)
      .map((c) => ({ catch: c, session })),
  );

  const allSpecies = [...new Set(catchesForProfile.map((cs) => cs.catch.species))].sort();

  const filteredCatches = catchesForProfile.filter((cs) => {
    if (filterSpecies && cs.catch.species !== filterSpecies) return false;
    if (filterSessionId && cs.session.id !== filterSessionId) return false;
    return true;
  });

  const sessionsWithCatches = sessions.filter((s) =>
    s.catches.some((c) => c.profileId === selectedProfileId),
  );

  if (selectedProfile) {
    return (
      <div className="profiles-detail" data-testid="profile-detail-view">
        <button
          className="btn btn-secondary btn-sm profiles-back-btn"
          onClick={() => {
            setSelectedProfileId(null);
            setFilterSpecies('');
            setFilterSessionId('');
          }}
          data-testid="profile-back-btn"
        >
          <ArrowLeft size={14} /> {t('profiles.back')}
        </button>

        <div className="profile-detail-header">
          <ProfileAvatar profile={selectedProfile} size={64} />
          <div className="profile-detail-meta">
            <h3 data-testid="profile-detail-nickname">{selectedProfile.nickname}</h3>
            <span className="text-muted">
              <Fish size={13} /> {catchesForProfile.length} {t('profiles.catches_title').toLowerCase()}
            </span>
          </div>
        </div>

        <div className="profile-catches-filters">
          <select
            value={filterSpecies}
            onChange={(e) => setFilterSpecies(e.target.value)}
            data-testid="profile-filter-species"
          >
            <option value="">{t('profiles.all_species')}</option>
            {allSpecies.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={filterSessionId}
            onChange={(e) => setFilterSessionId(e.target.value)}
            data-testid="profile-filter-session"
          >
            <option value="">{t('profiles.all_sessions')}</option>
            {sessionsWithCatches.map((s) => (
              <option key={s.id} value={s.id}>
                {s.date}{s.location.locationName ? ` · ${s.location.locationName}` : ''}
              </option>
            ))}
          </select>
        </div>

        {filteredCatches.length === 0 ? (
          <p className="empty-state" data-testid="profile-no-catches">{t('profiles.no_catches')}</p>
        ) : (
          <div className="catches-list">
            {filteredCatches.map(({ catch: c, session }) => (
              <div key={`${session.id}-${c.id}`} className="catch-item card profile-catch-item" data-testid={`profile-catch-item-${c.id}`}>
                <div className="catch-summary">
                  <span className="catch-species">🐟 {c.species}</span>
                  <div className="catch-meta">
                    {c.length && <span>{c.length} cm</span>}
                    {c.weight && <span>{c.weight} g</span>}
                    <span>{c.time}</span>
                    <span className="text-muted">{session.date}</span>
                    {session.location.locationName && (
                      <span className="text-muted">{session.location.locationName}</span>
                    )}
                  </div>
                </div>
                {c.photos?.[0] && (
                  <img
                    src={c.photos[0]}
                    alt={c.species}
                    className="profile-catch-thumb"
                    data-testid={`profile-catch-thumb-${c.id}`}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="profiles-view" data-testid="profiles-view">
      <div className="section-header">
        <h3>
          <User size={18} /> {t('profiles.title')}
        </h3>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              startNew();
            }
          }}
          data-testid="new-profile-btn"
        >
          <Plus size={16} /> {t('profiles.new_profile')}
        </button>
      </div>

      {showForm && (
        <div className="profile-form card" data-testid="profile-form">
          <h4>{t(editingId ? 'profiles.edit_profile' : 'profiles.new_profile')}</h4>

          <div className="form-group">
            <label>{t('profiles.nickname_label')}</label>
            <input
              type="text"
              placeholder={t('profiles.nickname_placeholder')}
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              data-testid="profile-nickname-input"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>
              <Camera size={14} /> {t('profiles.photo_label')}
            </label>
            <div className="profile-photo-editor">
              {form.previewUrl ? (
                <div className="profile-photo-preview-wrap">
                  <img
                    src={form.previewUrl}
                    alt=""
                    className="profile-form-preview"
                    data-testid="profile-photo-preview"
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleRemovePhoto}
                    data-testid="profile-remove-photo-btn"
                  >
                    <X size={14} /> {t('profiles.remove_photo')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => document.getElementById(photoInputId)?.click()}
                  data-testid="profile-add-photo-btn"
                >
                  <Camera size={14} /> {t('profiles.add_photo')}
                </button>
              )}
              <input
                id={photoInputId}
                type="file"
                accept="image/*"
                className="catch-photo-input"
                onChange={handlePhotoChange}
                data-testid="profile-photo-input"
              />
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-secondary" onClick={resetForm}>
              {t('profiles.cancel')}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!form.nickname.trim() || saving}
              data-testid="save-profile-btn"
            >
              {t('profiles.save')}
            </button>
          </div>
        </div>
      )}

      {profiles.length === 0 && !showForm ? (
        <div className="empty-state-large" data-testid="profiles-empty-state">
          <User size={48} className="empty-icon" />
          <h3>{t('profiles.no_profiles')}</h3>
          <p>{t('profiles.no_profiles_desc')}</p>
        </div>
      ) : (
        <div className="profiles-list">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="profile-card card"
              data-testid={`profile-card-${profile.id}`}
            >
              <button
                className="profile-card-main"
                onClick={() => {
                  setSelectedProfileId(profile.id);
                  setFilterSpecies('');
                  setFilterSessionId('');
                }}
                data-testid={`profile-open-btn-${profile.id}`}
              >
                <ProfileAvatar profile={profile} size={44} />
                <div className="profile-card-info">
                  <span className="profile-nickname">{profile.nickname}</span>
                  <span className="profile-catch-count text-muted">
                    <Fish size={12} />
                    {sessions.reduce(
                      (acc, s) => acc + s.catches.filter((c) => c.profileId === profile.id).length,
                      0,
                    )}{' '}
                    {t('profiles.catches_title').toLowerCase()}
                  </span>
                </div>
              </button>
              <div className="profile-card-actions">
                <button
                  className="btn btn-icon btn-secondary"
                  onClick={() => startEdit(profile)}
                  title={t('profiles.edit_profile')}
                  aria-label={t('profiles.edit_profile')}
                  data-testid={`edit-profile-btn-${profile.id}`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="btn btn-icon btn-danger"
                  onClick={() => handleDelete(profile.id)}
                  title={t('profiles.delete_profile')}
                  aria-label={t('profiles.delete_profile')}
                  data-testid={`delete-profile-btn-${profile.id}`}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
