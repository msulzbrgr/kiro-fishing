import { useRef, useState, useEffect, useCallback } from 'react';
import { Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  exportData,
  getExportPreview,
  importData,
  getStorageHealth,
  requestPersistentStorage,
  type StorageHealth,
  type ExportPreview,
} from '../utils/storage';

interface DataManagerProps {
  onImportSuccess: () => void;
  onStorageHealthChange?: (health: StorageHealth | null) => void;
}

const BYTES_PER_MB = 1024 * 1024;

export default function DataManager({ onImportSuccess, onStorageHealthChange }: DataManagerProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<
    { type: 'success'; message: string } | { type: 'error'; message: string } | null
  >(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [storageHealth, setStorageHealth] = useState<StorageHealth | null>(null);
  const [exportPreview, setExportPreview] = useState<ExportPreview | null>(null);
  const [persistenceTogglePending, setPersistenceTogglePending] = useState(false);

  const refreshStorageHealth = useCallback(async () => {
    const next = await getStorageHealth();
    setStorageHealth(next);
    onStorageHealthChange?.(next);
  }, [onStorageHealthChange]);

  const refreshExportPreview = useCallback(async () => {
    const preview = await getExportPreview();
    setExportPreview(preview);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [nextHealth, nextPreview] = await Promise.all([
        getStorageHealth(),
        getExportPreview(),
      ]);
      if (!cancelled) {
        setStorageHealth(nextHealth);
        onStorageHealthChange?.(nextHealth);
        setExportPreview(nextPreview);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onStorageHealthChange]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportData();
      await refreshStorageHealth();
      await refreshExportPreview();
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(t('data.import_confirm'))) {
      e.target.value = '';
      return;
    }

    setImporting(true);
    setStatus(null);

    const result = await importData(file);
    setImporting(false);
    e.target.value = '';

    if (result.success) {
      setStatus({
        type: 'success',
        message: t('data.import_success', { count: result.count }),
      });
      onImportSuccess();
      await refreshStorageHealth();
      await refreshExportPreview();
    } else {
      const translated = result.error.startsWith('storage.')
        ? t(result.error)
        : t('data.import_error');
      setStatus({ type: 'error', message: translated });
    }
  };

  const handleRequestPersistence = async () => {
    setPersistenceTogglePending(true);
    try {
      const success = await requestPersistentStorage();
      setStatus({
        type: success ? 'success' : 'error',
        message: success ? t('storage.persistence_enabled') : t('storage.persistence_failed'),
      });
      await refreshStorageHealth();
    } finally {
      setPersistenceTogglePending(false);
    }
  };

  const handlePersistenceToggle = async (nextChecked: boolean) => {
    if (nextChecked && !storageHealth?.persistent) {
      await handleRequestPersistence();
      return;
    }

    if (!nextChecked && storageHealth?.persistent) {
      setStatus({
        type: 'error',
        message: t('storage.persistence_disable_not_supported'),
      });
    }
  };

  return (
    <div className="data-manager">
      <div className="settings-section" data-testid="settings-import-export">
        <div className="settings-section-header">
          <h3>{t('settings.backups_title')}</h3>
          <p>{t('settings.backups_subtitle')}</p>
        </div>

        {exportPreview && (
          <div className="settings-preview" data-testid="export-preview">
            <span>
              {t('settings.export_preview', {
                sessions: exportPreview.sessionCount,
                photos: exportPreview.photoCount,
              })}
            </span>
          </div>
        )}
        <div className="settings-hint">{t('settings.backups_guidance')}</div>
        <div className="settings-hint">{t('settings.backups_restore_guidance')}</div>

        <div className="data-manager-actions">
          <button
            className="btn btn-secondary"
            onClick={handleExport}
            title={t('data.export_tooltip')}
            data-testid="export-btn"
            disabled={exporting}
          >
            <Download size={16} /> {exporting ? t('data.exporting') : t('data.export')}
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleImportClick}
            disabled={importing}
            title={t('data.import_tooltip')}
            data-testid="import-btn"
          >
            <Upload size={16} /> {importing ? t('data.importing') : t('data.import')}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.zip"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            data-testid="import-file-input"
          />
        </div>
      </div>

      {status && (
        <div className={`data-status data-status--${status.type}`}>
          {status.type === 'success' ? (
            <CheckCircle size={14} />
          ) : (
            <AlertCircle size={14} />
          )}
          {status.message}
        </div>
      )}
      {storageHealth?.supported && (
        <div className="settings-section" data-testid="settings-storage">
          <div className="settings-section-header">
            <h3>{t('settings.storage_title')}</h3>
            <p>{t('settings.storage_subtitle')}</p>
          </div>

          <div className="data-status" data-testid="storage-health">
            <span>
              {t('storage.usage')}: {Math.round((storageHealth.usage ?? 0) / BYTES_PER_MB)} MB
              {typeof storageHealth.quota === 'number'
                ? ` / ${Math.round(storageHealth.quota / BYTES_PER_MB)} MB`
                : ''}
              {typeof storageHealth.percentUsed === 'number'
                ? ` (${storageHealth.percentUsed}%)`
                : ''}
            </span>
          </div>
          <div className="settings-hint">{t('storage.quota_guidance')}</div>
          <div className="settings-hint">{t('storage.photo_usage_hint')}</div>

          <label className="settings-toggle" data-testid="storage-persistence-toggle">
            <span>{t('settings.persistent_storage_label')}</span>
            <input
              type="checkbox"
              checked={Boolean(storageHealth.persistent)}
              disabled={persistenceTogglePending}
              onChange={(e) => {
                void handlePersistenceToggle(e.target.checked);
              }}
            />
            <span className="settings-toggle-slider" aria-hidden="true" />
          </label>
          <div className="settings-hint">
            {storageHealth.persistent
              ? `${t('storage.persistent_yes')} · ${t('storage.persistence_disable_not_supported_short')}`
              : t('storage.persistent_no')}
          </div>
          <div className="settings-hint">{t('storage.persistence_best_effort')}</div>
          {!storageHealth.persistent && (
            <div className="settings-hint">{t('storage.persistence_browser_hint')}</div>
          )}
        </div>
      )}
    </div>
  );
}
