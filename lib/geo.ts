// Utilities for loading Snohomish County zoning GeoJSON and spatial lookup

import fs from 'node:fs/promises';
import path from 'node:path';

export type Position = [number, number]; // [lon, lat]
export type Polygon = Position[][]; // array of rings
export type MultiPolygon = Position[][][];

export type Geometry =
  | { type: 'Polygon'; coordinates: Polygon }
  | { type: 'MultiPolygon'; coordinates: MultiPolygon };

export type Feature = {
  type: 'Feature';
  id?: number | string;
  geometry: Geometry | null;
  properties: Record<string, any>;
};

export type FeatureCollection = {
  type: 'FeatureCollection';
  features: Feature[];
};

const FILENAME = 'snohomish-county.geojson';
let cachedGeo: FeatureCollection | null = null;

export async function loadZoningGeoJSON(baseUrl?: string): Promise<FeatureCollection> {
  if (cachedGeo) return cachedGeo;
  try {
    const file = path.join(process.cwd(), 'public', FILENAME);
    const raw = await fs.readFile(file, 'utf8');
    cachedGeo = JSON.parse(raw) as FeatureCollection;
  } catch {
    if (!baseUrl) throw new Error('GeoJSON not found on filesystem and no baseUrl provided');
    const res = await fetch(new URL('/' + FILENAME, baseUrl));
    if (!res.ok) throw new Error(`Failed to fetch GeoJSON: ${res.status}`);
    cachedGeo = (await res.json()) as FeatureCollection;
  }
  return cachedGeo!;
}

function pointInRing(pt: Position, ring: Position[]): boolean {
  // Ray casting algorithm; ignores last repeated vertex if present
  const [x, y] = pt;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygon(pt: Position, poly: Polygon): boolean {
  if (!poly || poly.length === 0) return false;
  if (!pointInRing(pt, poly[0])) return false; // outside outer ring
  for (let i = 1; i < poly.length; i++) {
    if (pointInRing(pt, poly[i])) return false; // inside a hole
  }
  return true;
}

function pointInGeometry(pt: Position, geom: Geometry | null): boolean {
  if (!geom) return false;
  if (geom.type === 'Polygon') return pointInPolygon(pt, geom.coordinates);
  if (geom.type === 'MultiPolygon') return geom.coordinates.some((p) => pointInPolygon(pt, p));
  return false;
}

export async function findFeatureAt(
  lat: number,
  lon: number,
  baseUrl?: string,
): Promise<Feature | null> {
  const geo = await loadZoningGeoJSON(baseUrl);
  const pt: Position = [lon, lat];
  return geo.features.find((f) => pointInGeometry(pt, f.geometry)) ?? null;
}

export function describeZoningFromFeature(lat: number, lon: number, f: Feature | null): string {
  if (!f) return `No zoning polygon found at ${lat}, ${lon}.`;
  const props = f.properties || {};
  const code = props.ZONE_CD ?? props.zone ?? props.code ?? 'unknown';
  const abbrev = props.ABBREV ?? props.abbrev ?? '';
  const label = props.LABEL ?? props.label ?? 'Zoning';
  return `Zoning at ${lat}, ${lon}: ${label}${abbrev ? ` (${abbrev})` : ''}${code !== 'unknown' ? `, code ${code}` : ''}.`;
}
