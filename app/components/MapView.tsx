'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { useMapContext } from '../state/MapContext';

type Props = { lat: number; lon: number; zoom?: number };

const MapView = ({ lat, lon, zoom = 12 }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const pinsMarkersRef = useRef<any[]>([]);
  const zoningCacheRef = useRef<Map<string, { label: string; abbrev?: string }>>(new Map());
  const mapState = useMapContext();

  // Ensure MapLibre CSS is present
  useEffect(() => {
    const id = 'maplibre-gl-css';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';
      document.head.appendChild(link);
    }
  }, []);

  // Initialize map when script ready
  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;
    const maplibregl = (window as any).maplibregl;
    if (!maplibregl) return;

    const style = {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution:
            '© OpenStreetMap contributors',
        },
      },
      layers: [
        { id: 'osm', type: 'raster', source: 'osm' }
      ],
    } as const;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: [lon, lat],
      zoom,
    });
    mapRef.current = map;

    // Once the base style is loaded, add the county GeoJSON and fit to it
    map.on('load', async () => {
      try {
        const res = await fetch('/snohomish-county.geojson');
        const geo = await res.json();

        // Add as a GeoJSON source
        if (!map.getSource('county')) {
          map.addSource('county', {
            type: 'geojson',
            data: geo,
          });
        }

        // Filled polygons
        if (!map.getLayer('county-fill')) {
          map.addLayer({
            id: 'county-fill',
            type: 'fill',
            source: 'county',
            paint: {
              'fill-color': '#2ec4b6',
              'fill-opacity': 0.25,
            },
          });
        }

        // Outline
        if (!map.getLayer('county-outline')) {
          map.addLayer({
            id: 'county-outline',
            type: 'line',
            source: 'county',
            paint: {
              'line-color': '#2ec4b6',
              'line-width': 2,
            },
          });
        }

        // Compute bounds of GeoJSON and fit the view
        const bounds = new maplibregl.LngLatBounds();
        const extend = (coord: number[]) => {
          if (Array.isArray(coord) && coord.length >= 2) {
            bounds.extend([coord[0], coord[1]]);
          }
        };
        const walk = (g: any) => {
          if (!g) return;
          const t = g.type;
          if (t === 'FeatureCollection') {
            g.features?.forEach((f: any) => walk(f.geometry));
          } else if (t === 'Feature') {
            walk(g.geometry);
          } else if (t === 'Point') {
            extend(g.coordinates);
          } else if (t === 'MultiPoint' || t === 'LineString') {
            g.coordinates?.forEach((c: number[]) => extend(c));
          } else if (t === 'MultiLineString' || t === 'Polygon') {
            g.coordinates?.forEach((ring: number[][]) => ring.forEach((c) => extend(c)));
          } else if (t === 'MultiPolygon') {
            g.coordinates?.forEach((poly: number[][][]) => poly.forEach((ring) => ring.forEach((c) => extend(c))));
          }
        };
        walk(geo);
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 24, duration: 800 });
        }

        

      } catch (err) {
        console.error('Failed to load GeoJSON', err);
      }
    });

    return () => {
      try {
        // cleanup pin markers
        pinsMarkersRef.current.forEach(m => {
          try { m.remove(); } catch {}
        });
        pinsMarkersRef.current = [];
        map.remove();
      } catch {}
      mapRef.current = null;
    };
  }, [ready, lat, lon, zoom]);

  // Update center/marker on prop change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setCenter([lon, lat]);
    map.setZoom(zoom);
  }, [lat, lon, zoom]);

  // Render multiple pins and fit bounds when pins change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // remove previous pins
    pinsMarkersRef.current.forEach((m) => {
      try { m.remove(); } catch {}
    });
    pinsMarkersRef.current = [];

    const pins = mapState?.pins ?? [];
    if (!pins.length) return;

    const maplibregl = (window as any).maplibregl;
    const bounds = new maplibregl.LngLatBounds();
    for (const p of pins) {
      const mk = new maplibregl.Marker({ color: '#8b5cf6' })
        .setLngLat([p.lon, p.lat]);

      // Clickable popup content
      const area = typeof p.areaSqft === 'number' && isFinite(p.areaSqft) ? Math.round(p.areaSqft).toLocaleString() + ' sq ft' : '—';
      const baseHtml = (zLabel?: string, zAbbrev?: string) => `
        <div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.2;">
          <div style="font-weight: 600; margin-bottom: 4px;">Parcel ${p.label ?? ''}</div>
          <div><strong>GPS:</strong> ${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}</div>
          <div><strong>Area:</strong> ${area}</div>
          <div><strong>Zoning:</strong> ${zLabel ? `${zLabel}${zAbbrev ? ` (${zAbbrev})` : ''}` : '—'}</div>
        </div>
      `;
      const popup = new maplibregl.Popup({ className: 'parcel-popup', offset: 12, closeButton: true }).setHTML(baseHtml(p.zoningLabel, p.zoningAbbrev));
      mk.setPopup(popup);

      mk.addTo(map);
      pinsMarkersRef.current.push(mk);
      bounds.extend([p.lon, p.lat]);

      // If zoning not provided, fetch from API and update popup
      if (!p.zoningLabel) {
        const key = `${p.lat.toFixed(5)},${p.lon.toFixed(5)}`;
        const cached = zoningCacheRef.current.get(key);
        if (cached) {
          try { popup.setHTML(baseHtml(cached.label, cached.abbrev)); } catch {}
        } else {
          (async () => {
            try {
              const res = await fetch(`/api/zoning?lat=${encodeURIComponent(p.lat)}&lon=${encodeURIComponent(p.lon)}`);
              if (!res.ok) return;
              const feature = await res.json();
              const props = feature?.properties || {};
              const zLabel: string | undefined = props.LABEL || props.label || undefined;
              const zAbbrev: string | undefined = props.ABBREV || props.abbrev || undefined;
              if (zLabel) {
                zoningCacheRef.current.set(key, { label: zLabel, abbrev: zAbbrev });
                try { popup.setHTML(baseHtml(zLabel, zAbbrev)); } catch {}
              }
            } catch {}
          })();
        }
      }
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 40, duration: 800 });
    }

    // Open popup for a focused pin label, if present
    if (mapState?.focusPinLabel) {
      const idx = pins.findIndex((p) => p.label === mapState.focusPinLabel);
      if (idx >= 0) {
        try { pinsMarkersRef.current[idx]?.togglePopup(); } catch {}
      }
      // Clear the focus request so it doesn't re-open next update
      mapState.set({ focusPinLabel: null });
    }
  }, [mapState?.pins]);

  return (
    <>
      <Script
        src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      <div ref={containerRef} className="map-frame" />
    </>
  );
};

export default MapView;
