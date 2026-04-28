import { useState } from 'react';
import { Cloud, Thermometer, Wind, Droplets, Waves, ArrowDown, ArrowUp, Save } from 'lucide-react';
import type { FishingSession, WeatherCondition, WaterClarity, WaterLevel, WaterCurrent } from '../types';
import { saveSession } from '../utils/storage';

interface ConditionsFormProps {
  session: FishingSession;
  onSessionUpdate: (session: FishingSession) => void;
}

const WEATHER_CONDITIONS: { value: WeatherCondition; label: string; emoji: string }[] = [
  { value: 'sunny', label: 'Sunny', emoji: '☀️' },
  { value: 'partly-cloudy', label: 'Partly Cloudy', emoji: '⛅' },
  { value: 'cloudy', label: 'Cloudy', emoji: '☁️' },
  { value: 'rainy', label: 'Rainy', emoji: '🌧️' },
  { value: 'stormy', label: 'Stormy', emoji: '⛈️' },
];

const WATER_CLARITY: { value: WaterClarity; label: string }[] = [
  { value: 'clear', label: 'Clear' },
  { value: 'slightly-murky', label: 'Slightly Murky' },
  { value: 'murky', label: 'Murky' },
];

const WATER_LEVELS: { value: WaterLevel; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
];

const WATER_CURRENTS: { value: WaterCurrent; label: string }[] = [
  { value: 'still', label: 'Still' },
  { value: 'slow', label: 'Slow' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'fast', label: 'Fast' },
];

export default function ConditionsForm({ session, onSessionUpdate }: ConditionsFormProps) {
  const [weather, setWeather] = useState({ ...session.weather });
  const [water, setWater] = useState({ ...session.water });
  const [saved, setSaved] = useState(false);

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
          <Cloud size={16} /> Weather Conditions
        </h4>
        <div className="form-grid">
          <div className="form-group">
            <label>
              <Thermometer size={14} /> Air Temperature (°C)
            </label>
            <input
              type="number"
              step="0.5"
              placeholder="e.g. 18"
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
              <Wind size={14} /> Wind Speed (km/h)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 12"
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
              <Droplets size={14} /> Humidity (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              placeholder="e.g. 65"
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
            <label>Weather Condition</label>
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
          <Waves size={16} /> Water Conditions
        </h4>
        <div className="form-grid">
          <div className="form-group">
            <label>
              <Thermometer size={14} /> Water Temperature (°C)
            </label>
            <input
              type="number"
              step="0.5"
              placeholder="e.g. 12"
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
            <label>Water Clarity</label>
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
              <ArrowUp size={14} /> Water Level
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
              <ArrowDown size={14} /> Current
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
        <button className={`btn btn-primary ${saved ? 'btn-saved' : ''}`} onClick={handleSave}>
          <Save size={16} /> {saved ? '✓ Saved!' : 'Save Conditions'}
        </button>
      </div>
    </div>
  );
}
