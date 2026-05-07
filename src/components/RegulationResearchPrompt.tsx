import { useTranslation } from 'react-i18next';
import type { FishingLocation } from '../types';
import { isOutsideSwitzerland } from '../utils/regulations';

interface RegulationResearchPromptProps {
  location: FishingLocation | null;
  dataTestId?: string;
}

export default function RegulationResearchPrompt({
  location,
  dataTestId,
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
      <strong>{t('regulation.research_prompt_title')}</strong>
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
