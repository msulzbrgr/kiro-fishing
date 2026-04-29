import { useRef, useState } from 'react';
import { Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { exportData, importData } from '../utils/storage';

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

  const handleExport = () => {
    exportData();
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
    } else {
      setStatus({ type: 'error', message: t('data.import_error') });
    }
  };

  return (
    <div className="data-manager">
      <div className="data-manager-actions">
        <button
          className="btn btn-secondary"
          onClick={handleExport}
          title={t('data.export_tooltip')}
          data-testid="export-btn"
        >
          <Download size={16} /> {t('data.export')}
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
          accept="application/json,.json"
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
    </div>
  );
}
