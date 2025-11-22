import type { MapState } from '../MapContext';
import type { MapAction } from './actions';

export const initialMapState: MapState = {
  lat: 47.6062,
  lon: -122.3321,
  zoom: 12,
  pins: [],
  lastPins: [], // For the Agent, this is essentially the most recent pins the user was looking into.
  focusPinLabel: null,
  // Placeholder; provider replaces with dispatch-backed fn
  set: () => {},
};

export const mapReducer = (state: MapState, action: MapAction): MapState => {
  switch (action.type) {
    case 'set':
      return { ...state, ...action.next };
    case 'setCenter':
      return { ...state, lat: action.lat, lon: action.lon };
    case 'setZoom':
      return { ...state, zoom: action.zoom };
    case 'setPins':
      return { ...state, pins: action.pins };
    case 'clearPinsKeepLast':
      return { ...state, lastPins: state.pins, pins: [] };
    case 'restorePins':
      return { ...state, pins: state.lastPins };
    case 'focus':
      return { ...state, focusPinLabel: action.label };
    default:
      return state;
  }
};
