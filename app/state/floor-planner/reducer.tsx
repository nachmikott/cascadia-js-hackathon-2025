import type { FloorPlannerState, Room, Rect } from '../FloorPlannerContext';
import type { FloorPlannerAction } from './actions';

const uid = () => Math.random().toString(36).slice(2, 9);

type FullState = 'setSvg' | 'setLoading';

export const initialFloorPlannerState: FullState = {
  svgMarkup: '',
  loading: false,
};

export const floorPlannerReducer = (state: FullState, action: FloorPlannerAction): FullState => {
  switch (action.type) {
    case 'setSvg':
      return { ...state, svgMarkup: action.svg };
    case 'setLoading':
      return { ...state, loading: action.value };
    default:
      return state;
  }
};
