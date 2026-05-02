import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, AlertTriangle, ShoppingCart, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CANTON_LAWS } from '../data/cantonLaws';
import { getRecordsByCanton } from '../data/regulationRecords';
import { isRegulationStale } from '../utils/regulations';
import type { CantonLaw } from '../types';

const CANTON_ORDER = [
  'ZH', 'BE', 'LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG',
  'FR', 'SO', 'BS', 'BL', 'SH', 'AR', 'AI', 'SG', 'GR',
  'AG', 'TG', 'TI', 'VD', 'VS', 'NE', 'GE', 'JU',
];

interface CantonCardProps {
  law: CantonLaw;
}

function CantonCard({ law }: CantonCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const stale = law.lastVerified ? isRegulationStale(law.lastVerified) : true;
  const records = getRecordsByCanton(law.cantonCode);
  const hasEnrichedRecords = records.length > 0;

  return (
    <div className={`canton-overview-card ${expanded ? 'expanded' : ''}`} data-testid={`canton-card-${law.cantonCode}`}>
      <button
        className="canton-overview-header"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={`canton-detail-${law.cantonCode}`}
      >
        <div className="canton-overview-title">
          <span className="canton-badge">{law.cantonCode}</span>
          <span className="canton-overview-name">{law.canton}</span>
          {hasEnrichedRecords && (
            <span className="canton-enriched-badge" aria-label={t('laws.enriched_label')}>
              ✓
            </span>
          )}
        </div>
        <div className="canton-overview-meta">
          {stale && (
            <AlertTriangle
              size={14}
              className="stale-icon"
              aria-label={t('laws.stale_warning_short')}
            />
          )}
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div id={`canton-detail-${law.cantonCode}`} className="canton-overview-detail">
          {law.generalInfo && <p className="canton-general-info">{law.generalInfo}</p>}

          {/* Freshness row */}
          {law.lastVerified && (
            <div className={`freshness-row ${stale ? 'stale' : 'fresh'}`}>
              <Info size={13} />
              <span>
                {t('laws.last_verified')}: {law.lastVerified}
                {law.regulationYear && ` · ${t('laws.regulation_year')}: ${law.regulationYear}`}
              </span>
              {stale && <span className="stale-badge">{t('laws.stale_badge')}</span>}
            </div>
          )}

          {/* Staleness warning */}
          {stale && (
            <div className="stale-warning" role="alert">
              <AlertTriangle size={14} />
              <span>{t('laws.stale_warning')}</span>
            </div>
          )}

          {/* Buy permit button */}
          {law.permitPurchaseUrl && (
            <a
              href={law.permitPurchaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm buy-permit-btn"
              data-testid={`buy-permit-${law.cantonCode}`}
            >
              <ShoppingCart size={14} />
              {t('laws.buy_permit')}
            </a>
          )}

          {/* Enriched regulation records */}
          {hasEnrichedRecords && (
            <div className="regulation-records">
              <strong className="records-label">{t('laws.regulation_records')}:</strong>
              <ul className="records-list">
                {records.map((rec) => (
                  <li key={rec.id} className="record-item">
                    <span className="record-topic">{t(`laws.topic_${rec.topic}`)}</span>
                    <p className="record-content">{rec.content}</p>
                    <a
                      href={rec.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="record-source"
                    >
                      <ExternalLink size={11} />
                      {t('laws.source_link')}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Legal sources */}
          {law.laws.length > 0 && (
            <div className="laws-list">
              <strong>📜 {t('map.legal_sources')}:</strong>
              <ul>
                {law.laws.map((l, i) => (
                  <li key={i}>
                    {l.url ? (
                      <a href={l.url} target="_blank" rel="noopener noreferrer">
                        {l.title}
                      </a>
                    ) : (
                      <span>{l.title}</span>
                    )}
                    <p className="law-description">{l.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Minimum sizes */}
          {law.minimumSizes && law.minimumSizes.length > 0 && (
            <div className="min-sizes">
              <strong>📏 {t('map.min_sizes')}:</strong>
              <table>
                <thead>
                  <tr>
                    <th>{t('map.species_col')}</th>
                    <th>{t('map.min_size_col')}</th>
                  </tr>
                </thead>
                <tbody>
                  {law.minimumSizes.map((s, i) => (
                    <tr key={i}>
                      <td>{s.species}</td>
                      <td>{s.sizeCm} cm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Disclaimer */}
          <div className="regulation-disclaimer" role="note">
            <Info size={13} />
            <span>{t('laws.disclaimer')}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CantonOverview() {
  const { t } = useTranslation();

  const cantons = CANTON_ORDER
    .map((code) => CANTON_LAWS[code])
    .filter(Boolean);

  return (
    <div className="canton-overview" data-testid="canton-overview">
      <div className="canton-overview-intro">
        <h3>{t('laws.overview_title')}</h3>
        <p>{t('laws.overview_subtitle')}</p>
      </div>
      <div className="canton-overview-list">
        {cantons.map((law) => (
          <CantonCard key={law.cantonCode} law={law} />
        ))}
      </div>
    </div>
  );
}
