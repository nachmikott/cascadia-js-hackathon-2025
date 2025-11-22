import fs from 'node:fs';
import readline from 'node:readline';
import path from 'node:path';
import { findFeatureAt } from './geo';

export type ParcelXY = { x_ft: number; y_ft: number; area_ft2?: number };

// Stream-search parcel-info.json for a key and extract X_COORD/Y_COORD/SHAPE__Area
export async function getParcelXYFromJSON(parcelId: string): Promise<ParcelXY | null> {
  // Try root-level first, then public/
  let jsonPath = path.join(process.cwd(), 'parcel-info.json');
  if (!fs.existsSync(jsonPath)) {
    const alt = path.join(process.cwd(), 'public', 'parcel-info.json');
    if (fs.existsSync(alt)) jsonPath = alt; else return null;
  }

  const stream = fs.createReadStream(jsonPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  // Allow leading whitespace before the key
  const escaped = parcelId.replace(/[-\/^$*+?.()|[\]{}]/g, '\\$&');
  const startRegex = new RegExp('^\\s*"' + escaped + '"\\s*:\\s*\\{\\s*$');

  let inBlock = false;
  let depth = 0;
  let x: number | null = null;
  let y: number | null = null;
  let area: number | null = null;

  for await (const raw of rl) {
    const line = raw.replace(/\r$/, '');
    if (!inBlock) {
      if (startRegex.test(line)) {
        inBlock = true;
        depth = 1; // opening '{' of the parcel object
      }
      continue;
    }

    // Within the parcel object; read until matching closing '}'
    for (const ch of line) {
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
    }

    if (x === null) {
      const m = line.match(/"X_COORD"\s*:\s*"?(-?\d+(?:\.\d+)?)"?/);
      if (m) x = Number(m[1]);
    }
    if (y === null) {
      const m = line.match(/"Y_COORD"\s*:\s*"?(-?\d+(?:\.\d+)?)"?/);
      if (m) y = Number(m[1]);
    }
    if (area === null) {
      const m = line.match(/"SHAPE__Area"\s*:\s*"?(-?\d+(?:\.\d+)?)"?/);
      if (m) area = Number(m[1]);
    }

    if (depth === 0) {
      // End of this parcel block
      rl.close();
      stream.close();
      if (x != null && y != null) {
        const out: ParcelXY = { x_ft: x, y_ft: y };
        if (area != null && Number.isFinite(area)) out.area_ft2 = area;
        return out;
      }
      return null;
    }
  }

  return null;
}

// Convert State Plane WA North (ftUS, EPSG:2926) to WGS84 lat/lon
export function spnToLonLat(x_ft: number, y_ft: number): { lat: number; lon: number } {
  const deg = Math.PI / 180;
  const a = 6378137.0; // GRS80
  const f = 1 / 298.257222101;
  const e2 = 2 * f - f * f;
  const e = Math.sqrt(e2);
  const phi1 = (48 + 44 / 60) * deg; // 48°44'
  const phi2 = (47 + 30 / 60) * deg; // 47°30'
  const phi0 = 47 * deg; // 47°00'
  const lam0 = -(120 + 50 / 60) * deg; // -120°50'
  const E0 = 1640416.6666666667; // ftUS
  const N0 = 0.0; // ftUS
  const FT_TO_M = 0.3048006096012192;
  const x = (x_ft - E0) * FT_TO_M;
  const y = (y_ft - N0) * FT_TO_M;

  const m = (phi: number) => Math.cos(phi) / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
  const t = (phi: number) => {
    const sinp = Math.sin(phi);
    return Math.tan(Math.PI / 4 - phi / 2) / ((1 - e * sinp) / (1 + e * sinp)) ** (e / 2);
  };

  const m1 = m(phi1);
  const m2 = m(phi2);
  const t1 = t(phi1);
  const t2 = t(phi2);
  const t0 = t(phi0);
  const n = (Math.log(m1) - Math.log(m2)) / (Math.log(t1) - Math.log(t2));
  const F = m1 / (n * t1 ** n);
  const rho0 = a * F * t0 ** n;

  const rho = Math.sign(n) * Math.hypot(x, rho0 - y);
  const theta = Math.atan2(x, rho0 - y);
  const t_ = (rho / (a * F)) ** (1 / n);

  let phi = Math.PI / 2 - 2 * Math.atan(t_);
  for (let i = 0; i < 8; i++) {
    const sinp = Math.sin(phi);
    const newPhi = Math.PI / 2 - 2 * Math.atan(t_ * ((1 - e * sinp) / (1 + e * sinp)) ** (e / 2));
    if (Math.abs(newPhi - phi) < 1e-12) break;
    phi = newPhi;
  }
  const lam = lam0 + theta / n;
  return { lat: (phi / Math.PI) * 180, lon: (lam / Math.PI) * 180 };
}

export type ParcelSearchParams = {
  zoneQuery?: string | null;
  minAreaSqFt?: number | null;
  limit?: number | null;
  baseUrl?: string; // for fetching GeoJSON in serverless
};

export type ParcelSearchResult = {
  parcel_id: string;
  lat: number;
  lon: number;
  area_sqft: number;
  zoning_label: string;
  zoning_abbrev?: string;
};

// Stream the large JSON and return up to `limit` parcels matching the zone and size criteria.
export async function searchParcelsByZone(params: ParcelSearchParams): Promise<ParcelSearchResult[]> {
  const zoneQuery = params.zoneQuery?.trim() ?? '';
  const minArea = Math.max(0, params.minAreaSqFt ?? 0);
  const limit = Math.max(1, Math.min(50, params.limit ?? 10));
  const baseUrl = params.baseUrl;

  // Locate file
  let jsonPath = path.join(process.cwd(), 'parcel-info.json');
  if (!fs.existsSync(jsonPath)) {
    const alt = path.join(process.cwd(), 'public', 'parcel-info.json');
    if (fs.existsSync(alt)) jsonPath = alt; else return [];
  }

  const stream = fs.createReadStream(jsonPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  const results: ParcelSearchResult[] = [];
  const startRegex = /^\s*"([^"]+)"\s*:\s*\{\s*$/;
  let inBlock = false;
  let depth = 0;
  let currentId: string | null = null;
  let x: number | null = null;
  let y: number | null = null;
  let area: number | null = null;

  const matchesZone = (label: string, abbrev?: string) => {
    if (!zoneQuery) {
      // default heuristic: residential
      const lab = label.toLowerCase();
      const ab = (abbrev ?? '').toLowerCase();
      return lab.includes('res') || /^r[\-0-9]/.test(ab);
    }
    const q = zoneQuery.toLowerCase();
    return label.toLowerCase().includes(q) || (abbrev ?? '').toLowerCase().includes(q);
  };

  for await (const raw of rl) {
    const line = raw.replace(/\r$/, '');
    if (!inBlock) {
      const m = line.match(startRegex);
      if (m) {
        inBlock = true;
        depth = 1;
        currentId = m[1];
        x = y = area = null;
      }
      continue;
    }

    for (const ch of line) {
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
    }

    if (x === null) {
      const m = line.match(/"X_COORD"\s*:\s*"?(-?\d+(?:\.\d+)?)"?/);
      if (m) x = Number(m[1]);
    }
    if (y === null) {
      const m = line.match(/"Y_COORD"\s*:\s*"?(-?\d+(?:\.\d+)?)"?/);
      if (m) y = Number(m[1]);
    }
    if (area === null) {
      const m = line.match(/"GIS_SQ_FT"\s*:\s*"?(-?\d+(?:\.\d+)?)"?/);
      if (m) area = Number(m[1]);
    }

    if (depth === 0) {
      // End of parcel block
      inBlock = false;
      if (currentId && x != null && y != null && (area ?? 0) >= minArea) {
        const { lat, lon } = spnToLonLat(x, y);
        try {
          const f = await findFeatureAt(lat, lon, baseUrl);
          const props: any = f?.properties ?? {};
          const label: string = props.LABEL ?? props.label ?? '';
          const abbrev: string | undefined = props.ABBREV ?? props.abbrev ?? undefined;
          if (label && matchesZone(label, abbrev)) {
            results.push({ parcel_id: currentId, lat, lon, area_sqft: area!, zoning_label: label, zoning_abbrev: abbrev });
            if (results.length >= limit) break;
          }
        } catch {
          // ignore failures per record
        }
      }
      currentId = null;
      x = y = area = null;
    }
  }

  rl.close();
  stream.close();
  return results;
}

// Convenience: resolve multiple parcel IDs to coordinates + area
export async function getParcelsByIds(ids: string[]): Promise<Array<{ parcel_id: string; lat: number; lon: number; area_sqft: number | null }>> {
  const out: Array<{ parcel_id: string; lat: number; lon: number; area_sqft: number | null }> = [];
  for (const id of ids) {
    try {
      const rec = await getParcelXYFromJSON(id);
      if (!rec) continue;
      const { lat, lon } = spnToLonLat(rec.x_ft, rec.y_ft);
      out.push({ parcel_id: id, lat, lon, area_sqft: rec.area_ft2 ?? null });
    } catch {
      // skip failures
    }
  }
  return out;
}
