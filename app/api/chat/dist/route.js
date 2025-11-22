"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.POST = exports.runtime = void 0;
var agents_1 = require("@openai/agents");
var schemas_1 = require("./schemas");
var tools_1 = require("./tools");
exports.runtime = "nodejs";
function POST(req) {
    var _a, _b;
    return __awaiter(this, void 0, Promise, function () {
        var json, parsed, _c, messages, todos, activeTab, plannerHasSvg, toolActions, starter, toolsAll, todosCtx, agent, TODO_TOOL_NAMES_1, todoTools, TODO_INSTRUCTIONS, conversation, result, reply, err_1, message;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 3, , 4]);
                    if (!process.env.OPENAI_API_KEY) {
                        return [2 /*return*/, new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY. Set it in .env.local" }), { status: 500, headers: { "content-type": "application/json" } })];
                    }
                    return [4 /*yield*/, req.json()];
                case 1:
                    json = _d.sent();
                    parsed = schemas_1.ChatRequestSchema.safeParse(json);
                    if (!parsed.success) {
                        return [2 /*return*/, new Response(JSON.stringify({ error: "Invalid payload", issues: parsed.error.issues }), { status: 400, headers: { "content-type": "application/json" } })];
                    }
                    _c = parsed.data, messages = _c.messages, todos = _c.todos, activeTab = _c.activeTab, plannerHasSvg = _c.plannerHasSvg;
                    toolActions = [];
                    // If user is on Floor Planner tab and no prior SVG exists, seed an initial render
                    // This action would be sent to the LangFlow API to make that request.
                    if (activeTab === 'floor' && !plannerHasSvg) {
                        toolActions.push({
                            type: 'floorPlanner_render',
                            instruction: 'Create a simple home layout: one living room, one kitchen, one bathroom, and one bedroom, all 10x10 feet, with an entry door from the outside into the living room.'
                        });
                    }
                    // If user is on To Dos tab and the list is empty, seed a helpful starter checklist
                    if (activeTab === 'todos' && (!Array.isArray(todos) || todos.length === 0)) {
                        starter = [
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
                    toolsAll = tools_1.createTools(req, toolActions, { todos: todos });
                    todosCtx = Array.isArray(todos) && todos.length
                        ? '\nCurrent To Do list:\n' + todos.map(function (t) { return "- " + (t.done ? '[x]' : '[ ]') + " " + t.title; }).join('\n')
                        : '';
                    agent = void 0;
                    if (activeTab === 'todos') {
                        TODO_TOOL_NAMES_1 = new Set([
                            'planBuildTasks', 'updateTodo', 'addTodos', 'removeTodo', 'renameTodo', 'listTodos'
                        ]);
                        todoTools = toolsAll.filter(function (t) { return TODO_TOOL_NAMES_1.has(t.name); });
                        TODO_INSTRUCTIONS = "You are the To Do Planner.\n" +
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
                        agent = new agents_1.Agent({
                            name: "To Do Planner",
                            instructions: TODO_INSTRUCTIONS + todosCtx,
                            tools: todoTools
                        });
                    }
                    else {
                        // THE ORCHESTRATOR
                        agent = new agents_1.Agent({
                            name: "The Clueless Crafter",
                            instructions: tools_1.AGENT_INSTRUCTIONS + todosCtx,
                            tools: toolsAll
                        });
                    }
                    conversation = messages
                        .map(function (message) { return (message.role === "user" ? "User" : "Assistant") + ": " + message.content; })
                        .join("\n");
                    return [4 /*yield*/, agents_1.run(agent, conversation)];
                case 2:
                    result = _d.sent();
                    reply = (_b = (_a = result) === null || _a === void 0 ? void 0 : _a.finalOutput) !== null && _b !== void 0 ? _b : "(no response)";
                    return [2 /*return*/, Response.json({ reply: reply, toolActions: toolActions })];
                case 3:
                    err_1 = _d.sent();
                    console.error("/api/chat error", err_1);
                    message = err_1 instanceof Error ? err_1.message : "Unexpected error";
                    return [2 /*return*/, new Response(JSON.stringify({ error: message }), {
                            status: 500,
                            headers: { "content-type": "application/json" }
                        })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.POST = POST;
