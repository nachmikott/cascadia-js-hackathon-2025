import type { MapPin, MapState } from '../MapContext';

// Action Types
export type MapAction =
  | { type: 'set'; next: Partial<Pick<MapState, 'lat' | 'lon' | 'zoom' | 'pins' | 'lastPins' | 'focusPinLabel'>> }
  | { type: 'setCenter'; lat: number; lon: number }
  | { type: 'setZoom'; zoom: number }
  | { type: 'setPins'; pins: MapPin[] }
  | { type: 'clearPinsKeepLast' }
  | { type: 'restorePins' }
  | { type: 'focus'; label: string | null };

// Action Creators
export const set = (next: MapAction extends { type: 'set'; next: infer N } ? N : never): MapAction => ({ type: 'set', next });
export const setCenter = (lat: number, lon: number): MapAction => ({ type: 'setCenter', lat, lon });
export const setZoom = (zoom: number): MapAction => ({ type: 'setZoom', zoom });
export const setPins = (pins: MapPin[]): MapAction => ({ type: 'setPins', pins });
export const clearPinsKeepLast = (): MapAction => ({ type: 'clearPinsKeepLast' });
export const restorePins = (): MapAction => ({ type: 'restorePins' });
export const focus = (label: string | null): MapAction => ({ type: 'focus', label });
