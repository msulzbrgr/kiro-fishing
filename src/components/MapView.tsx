import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { CANTON_LAWS, STATE_TO_CANTON_CODE } from '../data/cantonLaws';
import type { CantonLaw, FishingLocation } from '../types';

interface MapViewProps {
  onLocationSelect?: (location: FishingLocation) => void;
  initialLocation?: FishingLocation;
  compact?: boolean;
}

interface NominatimResult {
  display_name: string;
  address: {
    state?: string;
    county?: string;
    city?: string;
    town?: string;
    village?: string;
    country?: string;
    country_code?: string;
  };
}

async function reverseGeocode(lat: number, lng: number): Promise<NominatimResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=de`;
    const resp = await fetch(url, {
      headers: { 'Accept-Language': 'de' },
    });
    if (!resp.ok) return null;
    return (await resp.json()) as NominatimResult;
  } catch {
    return null;
  }
}

function detectCanton(result: NominatimResult): { code: string; name: string } | null {
  if (result.address.country_code !== 'ch') return null;
  const state = result.address.state ?? '';
  const code = STATE_TO_CANTON_CODE[state];
  if (code) return { code, name: state };
  // Try partial matches
  for (const [key, val] of Object.entries(STATE_TO_CANTON_CODE)) {
    if (state.includes(key) || key.includes(state)) {
      return { code: val, name: state };
    }
  }
  return null;
}

export default function MapView({ onLocationSelect, initialLocation, compact = false }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<FishingLocation | null>(
    initialLocation ?? null
  );
  const [cantonLaw, setCantonLaw] = useState<CantonLaw | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then((L) => {
      // Fix default icon URLs broken by Vite/webpack bundling
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const center: [number, number] = initialLocation
        ? [initialLocation.lat, initialLocation.lng]
        : [46.8182, 8.2275]; // Center of Switzerland

      const map = L.map(mapRef.current!, {
        center,
        zoom: initialLocation ? 12 : 8,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      if (initialLocation) {
        markerRef.current = L.marker([initialLocation.lat, initialLocation.lng]).addTo(map);
      }

      map.on('click', async (e: { latlng: { lat: number; lng: number } }) => {
        const { lat, lng } = e.latlng;

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng]).addTo(map);
        }

        setLoading(true);
        const result = await reverseGeocode(lat, lng);
        let location: FishingLocation = { lat, lng };

        if (result) {
          const canton = detectCanton(result);
          const addr = result.address;
          const placeName =
            addr.city ?? addr.town ?? addr.village ?? addr.county ?? result.display_name;
          location = {
            lat,
            lng,
            locationName: placeName,
            canton: canton?.name,
            cantonCode: canton?.code,
          };

          if (canton && CANTON_LAWS[canton.code]) {
            setCantonLaw(CANTON_LAWS[canton.code]);
          } else {
            setCantonLaw(null);
          }
        }

        setSelectedLocation(location);
        onLocationSelect?.(location);
        setLoading(false);
      });

      leafletMapRef.current = map;
      setMapReady(true);
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If initialLocation changes externally, update map
  useEffect(() => {
    if (!initialLocation || !leafletMapRef.current) return;
    import('leaflet').then((L) => {
      if (markerRef.current) {
        markerRef.current.setLatLng([initialLocation.lat, initialLocation.lng]);
      } else {
        markerRef.current = L.marker([initialLocation.lat, initialLocation.lng]).addTo(
          leafletMapRef.current
        );
      }
      leafletMapRef.current.setView([initialLocation.lat, initialLocation.lng], 12);
      if (initialLocation.cantonCode && CANTON_LAWS[initialLocation.cantonCode]) {
        setCantonLaw(CANTON_LAWS[initialLocation.cantonCode]);
      }
      setSelectedLocation(initialLocation);
    });
  }, [initialLocation]);

  const mapHeight = compact ? '250px' : '400px';

  return (
    <div className="map-view">
      <div className="map-header">
        <MapPin size={18} />
        <span>Click on the map to select your fishing location</span>
        {loading && <Loader2 size={16} className="spin" />}
      </div>

      <div
        ref={mapRef}
        style={{ height: mapHeight, width: '100%', borderRadius: '8px', zIndex: 0 }}
        className={!mapReady ? 'map-loading' : ''}
      />

      {!mapReady && (
        <div className="map-placeholder">
          <Loader2 size={24} className="spin" />
          <span>Loading map…</span>
        </div>
      )}

      {selectedLocation && (
        <div className="location-info">
          <div className="location-coords">
            <strong>Location:</strong>{' '}
            {selectedLocation.locationName ?? 'Unknown location'}
            {selectedLocation.canton && (
              <span className="canton-badge">{selectedLocation.canton}</span>
            )}
          </div>
          <div className="location-coords-raw">
            {selectedLocation.lat.toFixed(5)}°N, {selectedLocation.lng.toFixed(5)}°E
          </div>
        </div>
      )}

      {cantonLaw && !compact && (
        <div className="canton-laws">
          <h3 className="canton-laws-title">
            🎣 Fishing Laws — {cantonLaw.canton} ({cantonLaw.cantonCode})
          </h3>

          {cantonLaw.generalInfo && (
            <p className="canton-general-info">{cantonLaw.generalInfo}</p>
          )}

          {cantonLaw.permitInfo && (
            <div className="permit-info">
              <strong>📋 Permit:</strong> {cantonLaw.permitInfo}
            </div>
          )}

          <div className="laws-list">
            <strong>📜 Legal Sources:</strong>
            <ul>
              {cantonLaw.laws.map((law, i) => (
                <li key={i}>
                  {law.url ? (
                    <a href={law.url} target="_blank" rel="noopener noreferrer">
                      {law.title}
                    </a>
                  ) : (
                    <span>{law.title}</span>
                  )}
                  <p className="law-description">{law.description}</p>
                </li>
              ))}
            </ul>
          </div>

          {cantonLaw.minimumSizes && cantonLaw.minimumSizes.length > 0 && (
            <div className="min-sizes">
              <strong>📏 Minimum Catch Sizes:</strong>
              <table>
                <thead>
                  <tr>
                    <th>Species</th>
                    <th>Minimum Size</th>
                  </tr>
                </thead>
                <tbody>
                  {cantonLaw.minimumSizes.map((s, i) => (
                    <tr key={i}>
                      <td>{s.species}</td>
                      <td>{s.sizeCm} cm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedLocation && !selectedLocation.canton && !loading && (
        <div className="not-switzerland">
          ⚠️ No Swiss canton detected at this location. Please select a location within
          Switzerland.
        </div>
      )}
    </div>
  );
}
