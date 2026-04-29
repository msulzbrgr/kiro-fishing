import { useState } from 'react';
import { Cloud, Thermometer, Wind, Droplets, Waves, ArrowDown, ArrowUp, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FishingSession, WeatherCondition, WaterClarity, WaterLevel, WaterCurrent } from '../types';
import { saveSession } from '../utils/storage';

interface ConditionsFormProps {
  session: FishingSession;
  onSessionUpdate: (session: FishingSession) => void;
}

export default function ConditionsForm({ session, onSessionUpdate }: ConditionsFormProps) {
  const { t } = useTranslation();
  const [weather, setWeather] = useState({ ...session.weather });
  const [water, setWater] = useState({ ...session.water });
  const [saved, setSaved] = useState(false);

  const WEATHER_CONDITIONS: { value: WeatherCondition; label: string; emoji: string }[] = [
    { value: 'sunny', label: t('conditions.sunny'), emoji: '☀️' },
    { value: 'partly-cloudy', label: t('conditions.partly_cloudy'), emoji: '⛅' },
    { value: 'cloudy', label: t('conditions.cloudy'), emoji: '☁️' },
    { value: 'rainy', label: t('conditions.rainy'), emoji: '🌧️' },
    { value: 'stormy', label: t('conditions.stormy'), emoji: '⛈️' },
  ];

  const WATER_CLARITY: { value: WaterClarity; label: string }[] = [
    { value: 'clear', label: t('conditions.clear') },
    { value: 'slightly-murky', label: t('conditions.slightly_murky') },
    { value: 'murky', label: t('conditions.murky') },
  ];

  const WATER_LEVELS: { value: WaterLevel; label: string }[] = [
    { value: 'low', label: t('conditions.level_low') },
    { value: 'normal', label: t('conditions.level_normal') },
    { value: 'high', label: t('conditions.level_high') },
  ];

  const WATER_CURRENTS: { value: WaterCurrent; label: string }[] = [
    { value: 'still', label: t('conditions.current_still') },
    { value: 'slow', label: t('conditions.current_slow') },
    { value: 'moderate', label: t('conditions.current_moderate') },
    { value: 'fast', label: t('conditions.current_fast') },
  ];

  const handleSave = () => {
    const updated: FishingSession = { ...session, weather, water };
    saveSession(updated);
    onSessionUpdate(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="conditions-form">
      <div className="conditions-section">
        <h4>
          <Cloud size={16} /> {t('conditions.weather_title')}
        </h4>
        <div className="form-grid">
          <div className="form-group">
            <label>
              <Thermometer size={14} /> {t('conditions.air_temp')}
            </label>
            <input
              type="number"
              step="0.5"
              placeholder={t('conditions.air_temp_placeholder')}
              value={weather.temperature ?? ''}
              onChange={(e) =>
                setWeather({
                  ...weather,
                  temperature: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>
              <Wind size={14} /> {t('conditions.wind_speed')}
            </label>
            <input
              type="number"
              min="0"
              step="1"
              placeholder={t('conditions.wind_placeholder')}
              value={weather.windSpeed ?? ''}
              onChange={(e) =>
                setWeather({
                  ...weather,
                  windSpeed: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>
              <Droplets size={14} /> {t('conditions.humidity')}
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              placeholder={t('conditions.humidity_placeholder')}
              value={weather.humidity ?? ''}
              onChange={(e) =>
                setWeather({
                  ...weather,
                  humidity: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
            />
          </div>

          <div className="form-group form-group-full">
            <label>{t('conditions.weather_condition')}</label>
            <div className="pill-group">
              {WEATHER_CONDITIONS.map((wc) => (
                <button
                  key={wc.value}
                  className={`pill ${weather.condition === wc.value ? 'active' : ''}`}
                  onClick={() =>
                    setWeather({
                      ...weather,
                      condition: weather.condition === wc.value ? undefined : wc.value,
                    })
                  }
                >
                  {wc.emoji} {wc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="conditions-section">
        <h4>
          <Waves size={16} /> {t('conditions.water_title')}
        </h4>
        <div className="form-grid">
          <div className="form-group">
            <label>
              <Thermometer size={14} /> {t('conditions.water_temp')}
            </label>
            <input
              type="number"
              step="0.5"
              placeholder={t('conditions.water_temp_placeholder')}
              value={water.temperature ?? ''}
              onChange={(e) =>
                setWater({
                  ...water,
                  temperature: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>{t('conditions.water_clarity')}</label>
            <div className="pill-group">
              {WATER_CLARITY.map((wc) => (
                <button
                  key={wc.value}
                  className={`pill ${water.clarity === wc.value ? 'active' : ''}`}
                  onClick={() =>
                    setWater({
                      ...water,
                      clarity: water.clarity === wc.value ? undefined : wc.value,
                    })
                  }
                >
                  {wc.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>
              <ArrowUp size={14} /> {t('conditions.water_level')}
            </label>
            <div className="pill-group">
              {WATER_LEVELS.map((wl) => (
                <button
                  key={wl.value}
                  className={`pill ${water.level === wl.value ? 'active' : ''}`}
                  onClick={() =>
                    setWater({
                      ...water,
                      level: water.level === wl.value ? undefined : wl.value,
                    })
                  }
                >
                  {wl.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>
              <ArrowDown size={14} /> {t('conditions.current')}
            </label>
            <div className="pill-group">
              {WATER_CURRENTS.map((wc) => (
                <button
                  key={wc.value}
                  className={`pill ${water.current === wc.value ? 'active' : ''}`}
                  onClick={() =>
                    setWater({
                      ...water,
                      current: water.current === wc.value ? undefined : wc.value,
                    })
                  }
                >
                  {wc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button
          className={`btn btn-primary ${saved ? 'btn-saved' : ''}`}
          onClick={handleSave}
          data-testid="save-conditions-btn"
        >
          <Save size={16} /> {saved ? t('conditions.saved') : t('conditions.save')}
        </button>
      </div>
    </div>
  );
}
