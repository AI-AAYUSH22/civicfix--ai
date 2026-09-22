import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map as MapIcon } from 'lucide-react';
import type { PotholeCase } from '@/types';
import { markerColor } from '@/utils/caseUtils';

// Fix for default Leaflet marker icons not loading in React
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

const legend = [
  { label: 'Pending', color: '#D6483F' },
  { label: 'Under repair', color: '#E8A33D' },
  { label: 'Verification', color: '#1D3B65' },
  { label: 'Resolved', color: '#2E9E6D' },
];

function MapBounds({ cases }: { cases: PotholeCase[] }) {
  const map = useMap();
  useEffect(() => {
    const validCases = cases.filter(c => c.coordinates.lat && c.coordinates.lng);
    if (validCases.length > 0) {
      const bounds = L.latLngBounds(validCases.map(c => [c.coordinates.lat!, c.coordinates.lng!]));
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
    }
  }, [cases, map]);
  return null;
}

interface CityMapProps {
  cases: PotholeCase[];
  city: 'Mumbai' | 'Thane' | 'Navi Mumbai';
}

export default function CityMap({ cases, city }: CityMapProps) {
  const validCases = cases.filter((c) => c.city === city && c.coordinates.lat && c.coordinates.lng);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-base-border bg-base-surface p-5 shadow-soft z-0" style={{ zIndex: 0 }}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapIcon size={16} className="text-navy-500" />
          <h2 className="text-sm font-semibold text-navy-700">City map — {city}</h2>
        </div>
        <div className="flex items-center gap-3">
          {legend.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 text-xs text-navy-400">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <div className="relative min-h-[260px] flex-1 overflow-hidden rounded-lg bg-navy-50 z-0" style={{ zIndex: 0 }}>
        <MapContainer
          center={[19.0760, 72.8777]}
          zoom={11}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapBounds cases={validCases} />
          {validCases.map((c) => (
            <Marker
              key={c.id}
              position={[c.coordinates.lat!, c.coordinates.lng!]}
              icon={createCustomIcon(markerColor(c.status))}
            >
              <Popup>
                <div className="text-xs">
                  <p className="font-bold">{c.id}</p>
                  <p>{c.location}</p>
                  <p className="font-semibold mt-1" style={{ color: markerColor(c.status) }}>{c.status}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
