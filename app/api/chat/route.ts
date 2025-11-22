import { Agent, run } from "@openai/agents";
import { ChatRequestSchema } from "./schemas";
import { AGENT_INSTRUCTIONS, createTools } from "./tools";

export const runtime = "nodejs" as const;

export async function POST(req: Request): Promise<Response> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing OPENAI_API_KEY. Set it in .env.local" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    const json = await req.json();
    const parsed = ChatRequestSchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid payload", issues: parsed.error.issues }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // Things only available client side.
    const { messages, todos, activeTab, plannerHasSvg } = parsed.data as any;

    // Collect tool actions for the client to apply
    const toolActions: Array<Record<string, any>> = [];

    // If user is on Floor Planner tab and no prior SVG exists, seed an initial render
    // This action would be sent to the LangFlow API to make that request.
    if (activeTab === 'floor' && !plannerHasSvg) {
      toolActions.push({
        type: 'floorPlanner_render',
        instruction: 'Create a simple home layout: one living room, one kitchen, one bathroom, and one bedroom, all 10x10 feet, with an entry door from the outside into the living room.',
      });
    }

    // If user is on To Dos tab and the list is empty, seed a helpful starter checklist
    if (activeTab === 'todos' && (!Array.isArray(todos) || todos.length === 0)) {
      const starter = [
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
      toolActions.push({ type: 'todos_add', items: starter });
    }
    const toolsAll = createTools(req, toolActions, { todos });

    // Include current To Do list in instructions so the agent can reason about it
    const todosCtx = Array.isArray(todos) && todos.length
      ? '\nCurrent To Do list:\n' + todos.map((t: any) => `- ${t.done ? '[x]' : '[ ]'} ${t.title}`).join('\n')
      : '';

    let agent;
    if (activeTab === 'todos') {
      // APPLYTOOLACTIONS WILL DETERMINE WHICH CLIENT-SIDE CONTEXT TO USE.
      const TODO_TOOL_NAMES = new Set([
        'planBuildTasks', 'updateTodo', 'addTodos', 'removeTodo', 'renameTodo', 'listTodos'
      ]);
      const todoTools = toolsAll.filter((t: any) => TODO_TOOL_NAMES.has(t.name));
      
      // This Prompt was created using ChatGPT - I went with the "Seed Crystal" approach, Model Creates Prompt for Model.
      // Some things may need to be updated, PROHIBITED section is possibly irrelevant with the split of agents.
      // THIS WOULD HOPEFULLY BE A TODO LIST MANAGER - ADDING PHONE NUMBERS OF LOCALS ETCETERA.
      const TODO_INSTRUCTIONS =
        "You are the To Do Planner.\n" +
        "ROLE & SCOPE: You specialize in pre‑construction planning for a vacant parcel. Your ONLY responsibility is to plan and maintain the To Do list.\n" +
        "ALLOWED TOOLS: addTodos, updateTodo, removeTodo, renameTodo, listTodos, planBuildTasks. NEVER call any other tools.\n" +
        "PROHIBITED: Do NOT modify the map or floor planner, do NOT call zoning/map/floor tools.\n" +
        "BEHAVIOR:\n" +
        "- Use the Current To Do list (below) to avoid duplicates; consolidate similar items.\n" +
        "- If the user is vague, ask up to 2 clarifying questions before adding tasks.\n" +
        "- Propose a concise, prioritized checklist (5–10 items max) with clear, actionable titles (imperative mood).\n" +
        "- Typical areas: zoning clarifications, setbacks, survey/topo, utilities (water/sewer/power/gas/internet), geotech/soils, budget/program, design, bids, permitting, financing, timeline.\n" +
        "- When the user says an item is done/undone, or requests rename/removal, immediately update the list.\n" +
        "- After significant changes, call listTodos to show the updated list for confirmation.";
      agent = new Agent({
        name: "To Do Planner",
        instructions: TODO_INSTRUCTIONS + todosCtx,
        tools: todoTools,
      });
    } else {
      // THE ORCHESTRATOR
      agent = new Agent({
        name: "The Clueless Crafter",
        instructions: AGENT_INSTRUCTIONS + todosCtx,
        tools: toolsAll,
      });
    }

    // This could possibly require less of the messages as the Context Window in the future.
    // Much of the conversation would be irrelevant, as the user is going through ideas that would either
    // then be in the todos, or in the SVG.
    // Context is something definable
    const conversation = messages
      .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
      .join("\n");

    const result = await run(agent, conversation);
    const reply = (result as any)?.finalOutput ?? "(no response)";

    return Response.json({ reply, toolActions });
  } catch (err) {
    console.error("/api/chat error", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
