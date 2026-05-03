import { useRef, useState, useEffect, useCallback } from 'react';
import { Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  exportData,
  importData,
  getStorageHealth,
  requestPersistentStorage,
  type StorageHealth,
} from '../utils/storage';

interface DataManagerProps {
  onImportSuccess: () => void;
}

export default function DataManager({ onImportSuccess }: DataManagerProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<
    { type: 'success'; message: string } | { type: 'error'; message: string } | null
  >(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [storageHealth, setStorageHealth] = useState<StorageHealth | null>(null);

  const refreshStorageHealth = useCallback(async () => {
    const next = await getStorageHealth();
    setStorageHealth(next);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshStorageHealth();
  }, [refreshStorageHealth]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportData();
      await refreshStorageHealth();
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
    } else {
      const translated = result.error.startsWith('storage.')
        ? t(result.error)
        : t('data.import_error');
      setStatus({ type: 'error', message: translated });
    }
  };

  const handleRequestPersistence = async () => {
    const success = await requestPersistentStorage();
    setStatus({
      type: success ? 'success' : 'error',
      message: success ? t('storage.persistence_enabled') : t('storage.persistence_failed'),
    });
    await refreshStorageHealth();
  };

  return (
    <div className="data-manager">
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

        {/* Hidden file input — supports all modern browsers */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json,application/zip,.zip"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          data-testid="import-file-input"
        />
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
        <div className="data-status" data-testid="storage-health">
          <span>
            {t('storage.usage')}: {Math.round((storageHealth.usage ?? 0) / (1024 * 1024))} MB
            {typeof storageHealth.quota === 'number'
              ? ` / ${Math.round(storageHealth.quota / (1024 * 1024))} MB`
              : ''}
            {typeof storageHealth.percentUsed === 'number' ? ` (${storageHealth.percentUsed}%)` : ''}
          </span>
          <span>
            {storageHealth.persistent ? t('storage.persistent_yes') : t('storage.persistent_no')}
          </span>
          {!storageHealth.persistent && (
            <button className="btn btn-secondary btn-sm" onClick={handleRequestPersistence}>
              {t('storage.request_persistence')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
