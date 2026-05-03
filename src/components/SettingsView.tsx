import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import DataManager from './DataManager';
import { getStorageHealth, type StorageHealth } from '../utils/storage';

interface SettingsViewProps {
  onImportSuccess: () => void;
  onBadgeChange: (shouldShow: boolean) => void;
}

export default function SettingsView({ onImportSuccess, onBadgeChange }: SettingsViewProps) {
  const { t } = useTranslation();

  const updateBadgeFromHealth = useCallback(
    (health: StorageHealth | null) => {
      onBadgeChange(Boolean(health?.supported && !health.persistent));
    },
    [onBadgeChange],
  );

  const refreshBadge = useCallback(async () => {
    const health: StorageHealth = await getStorageHealth();
    updateBadgeFromHealth(health);
  }, [updateBadgeFromHealth]);

  useEffect(() => {
    void refreshBadge();
  }, [refreshBadge]);

  const handleImportSuccess = async () => {
    onImportSuccess();
    await refreshBadge();
  };

  return (
    <div>
      <div className="page-header">
        <h2>{t('settings.title')}</h2>
        <p>{t('settings.subtitle')}</p>
      </div>

      <DataManager onImportSuccess={handleImportSuccess} onStorageHealthChange={updateBadgeFromHealth} />
    </div>
  );
}
