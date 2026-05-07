import { useTranslation } from 'react-i18next';
import type { FishingLocation } from '../types';
import { buildRegulationResearchPrompt, isOutsideSwitzerland } from '../utils/regulations';

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

  return (
    <div className="research-prompt-card" data-testid={dataTestId}>
      <strong>{t('regulation.research_prompt_title')}</strong>
      <p>{t('regulation.research_prompt_desc')}</p>
      <textarea
        className="research-prompt-textarea"
        value={buildRegulationResearchPrompt(location)}
        readOnly
        rows={6}
        data-testid={dataTestId ? `${dataTestId}-textarea` : undefined}
      />
    </div>
  );
}
