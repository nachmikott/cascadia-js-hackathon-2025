'use client';

import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import { mapReducer, initialMapState } from './map/reducer';
import * as MapActions from './map/actions';

export type MapPin = { lat: number; lon: number; label?: string; areaSqft?: number; zoningLabel?: string; zoningAbbrev?: string };

export type MapState = {
  lat: number;
  lon: number;
  zoom: number;
  pins: MapPin[];
  lastPins: MapPin[];
  focusPinLabel: string | null;
  set: (next: Partial<Pick<MapState, 'lat' | 'lon' | 'zoom' | 'pins' | 'lastPins' | 'focusPinLabel'>>) => void;
};


const MapContext = createContext<MapState | null>(null);

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(mapReducer, initialMapState);

  const value = useMemo<MapState>(() => ({
    ...state,
    set: (next) => dispatch(MapActions.set(next)),
  }), [state]);

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

export const useMapContext = () => {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error('useMap must be used within MapProvider');
  return ctx;
};
