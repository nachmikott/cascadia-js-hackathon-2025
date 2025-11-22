import { z } from 'zod';
import { tool } from '@openai/agents';
import { describeZoningFromFeature, findFeatureAt } from '../../../lib/geo';
import { getParcelXYFromJSON, spnToLonLat, searchParcelsByZone, getParcelsByIds } from '../../../lib/parcels';

export const AGENT_INSTRUCTIONS =
  "You are a helpful assistant.\n" +
  "- Map: When the user references a location (city, address, or coordinates), call update_map with numeric lat/lon and optional zoom.\n" +
  "- Zoning: When the user asks about zoning and provides GPS coordinates, call lookupZoningByGPS with lat/lon and include the result.\n" +
  "- Parcel focus: When the user provides a parcel number (parcel_id), call lookupZoningByParcel to return the zoning for that parcel. Replace existing pins with a single pin on that parcel and center the map.\n" +
  "- Parcel options: When the user asks for parcel options by size/zone (e.g., building a 10,000 sq ft home), call findParcelsByZone and ensure pins are updated on the map.\n" +
  "- Pins: When the user asks to pin specific parcels (or follow-up refers to previously listed parcel IDs), call pinParcelsByIds to (re)pin them. If the user says to go back to the previous set of pins, call restorePreviousPins.\n" +
  "- Floor planning: When the user wants to design or update the floor plan (blueprints), call renderFloorPlanner with the user's natural-language instruction (concise but complete). This switches to the Floor Planner and renders the returned SVG. If the user had no prior SVG, start off with a very simple house concept (a bedroom on the left, a bathroom on the right, a living room and kitchen in the middle. The house entry should be on the top wall of the living room and kitchen.).\n" +
  "- Floor planner updates: On any follow-up requests to modify the plan, call renderFloorPlanner again with the new instructions (you may reference prior context succinctly). Rely on renderFloorPlanner to interpret changes using the existing SVG.\n" +
  "- To Do list: Only update the To Do list when appropriate (or when the To Do Planner agent is active). Use addTodos, updateTodo, removeTodo, renameTodo, and listTodos. When discussing or updating To Dos, switch to the To Dos tab.\n" +
  "Otherwise, reply normally.";

export function createTools(
  req: Request,
  toolActions: Array<Record<string, any>>,
  ctx?: { todos?: Array<{ title: string; done?: boolean }> }
) {
  // update_map
  const UpdateMapArgs = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
    zoom: z.coerce.number().min(0).max(22).nullable().default(null),
  });
  const updateMap = tool({
    name: 'update_map',
    description: 'Update the map center and optional zoom using GPS coordinates.',
    parameters: UpdateMapArgs,
    execute: async (args) => {
      toolActions.push({ type: 'update_map', ...args });
      return `Centered map at ${args.lat}, ${args.lon}${args.zoom != null ? ` (zoom ${args.zoom})` : ''}.`;
    },
  });

  // lookupZoningByGPS
  const LookupZoningByGPSArgs = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
  });
  const lookupZoningByGPS = tool({
    name: 'lookupZoningByGPS',
    description: 'Given GPS coordinates (lat, lon), look up and describe the zoning at that point from local GeoJSON.',
    parameters: LookupZoningByGPSArgs,
    execute: async ({ lat, lon }) => {
      const baseUrl = new URL(req.url).origin;
      const feature = await findFeatureAt(lat, lon, baseUrl);
      return describeZoningFromFeature(lat, lon, feature);
    },
  });

  // lookupZoningByParcel
  const LookupZoningByParcelArgs = z.object({ parcel_id: z.string().min(3) });
  const lookupZoningByParcel = tool({
    name: 'lookupZoningByParcel',
    description: 'Given a parcel number (parcel_id), find its coordinates and return the zoning at that location, and center the map there.',
    parameters: LookupZoningByParcelArgs,
    execute: async ({ parcel_id }) => {
      const rec = await getParcelXYFromJSON(parcel_id);
      if (!rec) return `Parcel ${parcel_id} not found.`;
      const { lat, lon } = spnToLonLat(rec.x_ft, rec.y_ft);
      const baseUrl = new URL(req.url).origin;
      const feature = await findFeatureAt(lat, lon, baseUrl);
      const desc = describeZoningFromFeature(lat, lon, feature);
      // Replace any existing pins with this single parcel pin and fit to it
      toolActions.push({ type: 'clear_pins' });
      toolActions.push({ type: 'show_pins', open: true, points: [{ lat, lon, label: parcel_id, area_sqft: rec.area_ft2 ?? undefined }] });
      return `Parcel ${parcel_id}: ${desc}`;
    },
  });

  // findParcelsByZone
  const FindParcelsArgs = z.object({
    zoneQuery: z.string().min(2).optional().nullable(),
    minAreaSqFt: z.coerce.number().min(0).optional().nullable(),
    limit: z.coerce.number().min(1).max(50).optional().nullable(),
  });
  const findParcelsByZoneTool = tool({
    name: 'findParcelsByZone',
    description:
      'Search parcels across Snohomish County that match a zoning label/abbrev and a minimum lot size (GIS_SQ_FT). If zoneQuery is omitted, defaults to residential zones.',
    parameters: FindParcelsArgs,
    execute: async ({ zoneQuery = null, minAreaSqFt = null, limit = null }) => {
      const baseUrl = new URL(req.url).origin;
      const results = await searchParcelsByZone({
        zoneQuery,
        minAreaSqFt: minAreaSqFt ?? undefined,
        limit: limit ?? undefined,
        baseUrl,
      });
      if (!results.length) return 'No parcels matched the criteria.';
      toolActions.push({ type: 'clear_pins' });
      toolActions.push({
        type: 'show_pins',
        points: results.map((r) => ({ lat: r.lat, lon: r.lon, label: r.parcel_id, area_sqft: r.area_sqft })),
      });
      const lines = results.map(
        (r, i) => `${i + 1}. Parcel ${r.parcel_id} – ${r.zoning_label}${r.zoning_abbrev ? ` (${r.zoning_abbrev})` : ''}, ${Math.round(r.area_sqft).toLocaleString()} sq ft at ${r.lat.toFixed(5)}, ${r.lon.toFixed(5)}`,
      );
      return `Top ${results.length} parcels:\n` + lines.join('\n');
    },
  });

  // pinParcelsByIds
  const PinParcelsArgs = z.object({
    parcel_ids: z.array(z.string().min(3)).min(1),
    clearFirst: z.boolean().optional().nullable(),
  });
  const pinParcelsByIdsTool = tool({
    name: 'pinParcelsByIds',
    description:
      'Given a list of parcel_ids, resolve their coordinates from parcel-info.json and pin them on the map. Optionally clear existing pins first.',
    parameters: PinParcelsArgs,
    execute: async ({ parcel_ids, clearFirst = true }) => {
      const rows = await getParcelsByIds(parcel_ids);
      if (!rows.length) return 'No valid parcels resolved to coordinates.';
      if (clearFirst) toolActions.push({ type: 'clear_pins' });
      toolActions.push({
        type: 'show_pins',
        points: rows.map((r) => ({ lat: r.lat, lon: r.lon, label: r.parcel_id, area_sqft: r.area_sqft ?? undefined })),
      });
      return `Pinned ${rows.length} parcel${rows.length === 1 ? '' : 's'} on the map.`;
    },
  });

  // planBuildTasks: seed a checklist once user commits to a parcel
  const PlanTasksArgs = z.object({
    parcel_id: z.string().min(3).optional().nullable(),
  });
  const planBuildTasks = tool({
    name: 'planBuildTasks',
    description: 'Add a standard checklist of tasks needed to move forward building on a selected parcel (permitting, surveys, utilities, financing, design, bids, timeline).',
    parameters: PlanTasksArgs,
    execute: async ({ parcel_id = null }) => {
      toolActions.push({ type: 'switch_tab', tab: 'todos' });
      const tasks = [
        'Confirm parcel ownership and legal description',
        'Check zoning allowances and setbacks',
        'Order site survey and topography',
        'Assess utilities (water, sewer/septic, power, gas, internet)',
        'Schedule geotechnical/soil assessment (if needed)',
        'Define program and budget',
        'Engage architect/design (schematic design)',
        'Gather contractor bids',
        'Plan permitting timeline and submittals',
        'Secure financing/pre-approval',
      ];
      toolActions.push({ type: 'todos_add', items: tasks });
      return `Added a starter build checklist${parcel_id ? ` for parcel ${parcel_id}` : ''}. You can mark items done or ask me to update them.`;
    },
  });

  // updateTodo: mark by title
  const UpdateTodoArgs = z.object({ title: z.string().min(1), done: z.boolean() });
  const updateTodo = tool({
    name: 'updateTodo',
    description: 'Mark a to-do by its exact title as done or not done.',
    parameters: UpdateTodoArgs,
    execute: async ({ title, done }) => {
      toolActions.push({ type: 'switch_tab', tab: 'todos' });
      toolActions.push({ type: 'todos_mark', items: [{ title, done }] });
      return `${done ? 'Marked' : 'Unmarked'} “${title}”.`;
    },
  });

  // addTodos: add multiple to-dos by title
  const AddTodosArgs = z.object({ items: z.array(z.string().min(1)).min(1) }).strict();
  const addTodos = tool({
    name: 'addTodos',
    description: 'Add one or more to-do items by title.',
    parameters: AddTodosArgs,
    execute: async ({ items }) => {
      toolActions.push({ type: 'switch_tab', tab: 'todos' });
      toolActions.push({ type: 'todos_add', items });
      return `Added ${items.length} to-do item(s).`;
    },
  });

  // removeTodo: remove a to-do by exact title
  const RemoveTodoArgs = z.object({ title: z.string().min(1) }).strict();
  const removeTodo = tool({
    name: 'removeTodo',
    description: 'Remove a to-do by its exact title.',
    parameters: RemoveTodoArgs,
    execute: async ({ title }) => {
      toolActions.push({ type: 'switch_tab', tab: 'todos' });
      toolActions.push({ type: 'todos_remove', titles: [title] });
      return `Removed “${title}”.`;
    },
  });

  // listTodos: return the current To Do list from context
  const ListTodosArgs = z.object({}).strict();
  const listTodos = tool({
    name: 'listTodos',
    description: 'List the current To Do items with their done status.',
    parameters: ListTodosArgs,
    execute: async () => {
      toolActions.push({ type: 'switch_tab', tab: 'todos' });
      const todos = ctx?.todos ?? [];
      if (!todos.length) return 'No To Do items yet.';
      const lines = todos.map((t) => `- ${t.done ? '[x]' : '[ ]'} ${t.title}`);
      return `Current To Do list:\n${lines.join('\n')}`;
    },
  });

  // renameTodo: rename a to-do by its exact current title
  const RenameTodoArgs = z.object({ oldTitle: z.string().min(1), newTitle: z.string().min(1) }).strict();
  const renameTodo = tool({
    name: 'renameTodo',
    description: 'Rename a to-do by its exact current title to a new title.',
    parameters: RenameTodoArgs,
    execute: async ({ oldTitle, newTitle }) => {
      toolActions.push({ type: 'switch_tab', tab: 'todos' });
      toolActions.push({ type: 'todos_rename', oldTitle, newTitle });
      return `Renamed “${oldTitle}” to “${newTitle}”.`;
    },
  });

  // restorePreviousPins: ask the client to restore prior pin set
  const restorePreviousPins = tool({
    name: 'restorePreviousPins',
    description: 'Restore the previous set of pins on the map (e.g., after focusing on a single parcel).',
    parameters: z.object({}).strict(),
    execute: async () => {
      toolActions.push({ type: 'restore_pins' });
      return 'Restored the previous set of pins.';
    },
  });

  // renderFloorPlanner: send instruction to floor planner render API and update SVG
  const RenderFloorPlannerArgs = z.object({ instruction: z.string().min(1) }).strict();
  const renderFloorPlanner = tool({
    name: 'renderFloorPlanner',
    description: 'Render the floor plan by sending the user instruction to the floor planner API. Returns a confirmation and switches to the Floor Planner tab.',
    parameters: RenderFloorPlannerArgs,
    execute: async ({ instruction }) => {
      toolActions.push({ type: 'switch_tab', tab: 'floor' });
      toolActions.push({ type: 'floorPlanner_render', instruction });
      return 'Rendering your floor plan now — this may take a few seconds. I’ll update the canvas when it’s ready.';
    },
  });

  return [
    updateMap,
    lookupZoningByGPS,
    lookupZoningByParcel,
    findParcelsByZoneTool,
    pinParcelsByIdsTool,
    restorePreviousPins,
    planBuildTasks,
    updateTodo,
    addTodos,
    removeTodo,
    renameTodo,
    listTodos,
    renderFloorPlanner,
  ];
}
