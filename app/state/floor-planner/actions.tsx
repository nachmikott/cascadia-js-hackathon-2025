import type { Room, Rect } from '../FloorPlannerContext';

export type FloorPlannerAction =
  | { type: 'setAll'; next: { rooms?: Room[]; doors?: Rect[]; windows?: Rect[] } }
  | { type: 'applyOps'; ops: Array<{ type: string; [k: string]: any }> }
  | { type: 'setSvg'; svg: string }
  | { type: 'setLoading'; value: boolean };

export const setAll = (next: { rooms?: Room[]; doors?: Rect[]; windows?: Rect[] }): FloorPlannerAction => ({ type: 'setAll', next });
export const applyOps = (ops: Array<{ type: string; [k: string]: any }>): FloorPlannerAction => ({ type: 'applyOps', ops });
export const setSvg = (svg: string): FloorPlannerAction => ({ type: 'setSvg', svg });
export const setLoading = (value: boolean): FloorPlannerAction => ({ type: 'setLoading', value });
