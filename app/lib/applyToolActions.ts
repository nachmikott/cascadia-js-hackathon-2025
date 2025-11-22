'use client';

import type { TabKey } from '../state/UiContext';
import type { MapState } from '../state/MapContext';
import type { FloorPlannerState } from '../state/FloorPlannerContext';

type TodoContext = {
  items: Array<{ title: string; done?: boolean }>;
  addMany: (titles: string[]) => void;
  markByTitle: (title: string, done: boolean) => void;
  renameByTitle: (oldTitle: string, newTitle: string) => void;
  removeByTitle: (title: string) => void;
};

type UiContext = { setActiveTab: (tab: TabKey) => void };

export async function applyToolActions(
  actions: Array<Record<string, any>>, 
  deps: {
    mapContext: MapState;
    todoContext: TodoContext;
    plannerContext: FloorPlannerState;
    uiContext: UiContext;
    extractSvgElement: (s: string) => string;
  }
) {
  const { mapContext, todoContext, plannerContext, uiContext, extractSvgElement } = deps;

  for (const act of actions) {
    if (act?.type === 'update_map') {
      mapContext.set({
        lat: typeof act.lat === 'number' ? act.lat : mapContext.lat,
        lon: typeof act.lon === 'number' ? act.lon : mapContext.lon,
        zoom: typeof act.zoom === 'number' ? act.zoom : mapContext.zoom,
      });
    } else if (act?.type === 'show_pins' && Array.isArray(act.points)) {
      const points = act.points
        .filter((p: any) => Number.isFinite(p?.lat) && Number.isFinite(p?.lon))
        .map((p: any) => ({
          lat: p.lat as number,
          lon: p.lon as number,
          label: typeof p.label === 'string' ? p.label : undefined,
          areaSqft: Number.isFinite(p?.area_sqft) ? (p.area_sqft as number) : undefined,
        }));
      const open = Boolean(act.open) && points.length === 1 && typeof act.points[0]?.label === 'string';
      mapContext.set({ pins: points, focusPinLabel: open ? (act.points[0].label as string) : null });
    } else if (act?.type === 'clear_pins') {
      mapContext.set({ lastPins: mapContext.pins, pins: [] });
    } else if (act?.type === 'restore_pins') {
      mapContext.set({ pins: mapContext.lastPins });
    } else if (act?.type === 'todos_add' && Array.isArray(act.items)) {
      const titles = act.items.filter((s: any) => typeof s === 'string' && s.trim());
      if (titles.length) todoContext.addMany(titles);
    } else if (act?.type === 'todos_mark' && Array.isArray(act.items)) {
      for (const it of act.items) {
        if (typeof it?.title === 'string' && typeof it?.done === 'boolean') {
          todoContext.markByTitle(it.title, it.done);
        }
      }
    } else if (act?.type === 'todos_remove' && Array.isArray(act.titles)) {
      for (const title of act.titles) {
        if (typeof title === 'string') todoContext.removeByTitle(title);
      }
    } else if (act?.type === 'todos_rename' && typeof act.oldTitle === 'string' && typeof act.newTitle === 'string') {
      todoContext.renameByTitle(act.oldTitle, act.newTitle);
    } else if (act?.type === 'switch_tab' && typeof act.tab === 'string') {
      try { ui.setActiveTab(act.tab as TabKey); } catch {}
    } else if (act?.type === 'floorPlanner_render' && typeof act.instruction === 'string') {
      plannerContext.setLoading(true);
      try {

        // The Orchestrator Agent doesn't know about the already existant SVG rendered, so we need to add that to the context to call LangFlow SVG Creator/Modifier
        const hasExistingSvg = typeof plannerContext.svgMarkup === 'string' && plannerContext.svgMarkup.trim().length > 0;
        const combinedInstruction = hasExistingSvg
          ? `${act.instruction}\n\nExisting SVG to refine (only svg element follows):\n${plannerContext.svgMarkup}`
          : act.instruction;

        // THIS IS LANGFLOW COPY/PASTE
        const payload = {
          output_type: 'chat',
          input_type: 'chat',
          input_value: combinedInstruction,
          session_id: 'user_1',
        } as const;

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const apiKey = process.env.NEXT_PUBLIC_LANGFLOW_API_KEY;
        if (apiKey) headers['x-api-key'] = apiKey;

        const options: RequestInit = {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        };

        const resp = await fetch('http://localhost:7860/api/v1/run/e7b44d28-a5d8-42a8-ba9a-12c7608c824a', options);
        const json = await resp.json();
        if (!resp.ok) throw new Error((json && (json.error || json.message)) || 'FloorPlanner render failed');

        const message = json?.outputs?.[0]?.outputs?.[0]?.artifacts?.message as string | undefined;

        // The Langflow should return an SVG. It may need to be extracted.
        const svg = extractSvgElement(message || '');
        plannerContext.setSvg(svg || 'Could not load SVG');
      } catch (err) {
        console.error(err);
      } finally {
        plannerContext.setLoading(false);
      }
    }
  }
}
