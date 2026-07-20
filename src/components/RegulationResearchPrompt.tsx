import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FishingLocation } from '../types';
import { isOutsideSwitzerland } from '../utils/regulations';

interface RegulationResearchPromptProps {
  location: FishingLocation | null;
  dataTestId?: string;
  onDismiss?: () => void;
}

export default function RegulationResearchPrompt({
  location,
  dataTestId,
  onDismiss,
}: RegulationResearchPromptProps) {
  const { t } = useTranslation();

  if (!location || !isOutsideSwitzerland(location)) {
    return null;
  }

  const prompt = t('regulation.research_prompt_template', {
    location: location.locationName ?? t('map.unknown_location'),
    country: location.country ?? t('map.unknown_location'),
    lat: location.lat.toFixed(5),
    lng: location.lng.toFixed(5),
  });

  return (
    <div className="research-prompt-card" data-testid={dataTestId}>
      <div className="panel-header">
        <strong>{t('regulation.research_prompt_title')}</strong>
        {onDismiss && (
          <button
            className="btn btn-icon panel-close-btn"
            onClick={onDismiss}
            aria-label={t('regulation.dismiss_panel')}
            data-testid={dataTestId ? `${dataTestId}-dismiss` : undefined}
          >
            <X size={14} />
          </button>
        )}
      </div>
      <p>{t('regulation.research_prompt_desc')}</p>
      <textarea
        className="research-prompt-textarea"
        value={prompt}
        readOnly
        rows={6}
        data-testid={dataTestId ? `${dataTestId}-textarea` : undefined}
      />
    </div>
  );
}
