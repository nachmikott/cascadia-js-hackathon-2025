'use client';
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
exports.applyToolActions = void 0;
function applyToolActions(actions, deps) {
    var _a, _b, _c, _d, _e, _f;
    return __awaiter(this, void 0, void 0, function () {
        var mapContext, todoContext, plannerContext, uiContext, extractSvgElement, _i, actions_1, act, points, open, titles, _g, _h, it, _j, _k, title, hasExistingSvg, combinedInstruction, payload, headers, apiKey, options, resp, json, message, svg, err_1;
        return __generator(this, function (_l) {
            switch (_l.label) {
                case 0:
                    mapContext = deps.mapContext, todoContext = deps.todoContext, plannerContext = deps.plannerContext, uiContext = deps.uiContext, extractSvgElement = deps.extractSvgElement;
                    _i = 0, actions_1 = actions;
                    _l.label = 1;
                case 1:
                    if (!(_i < actions_1.length)) return [3 /*break*/, 17];
                    act = actions_1[_i];
                    if (!((act === null || act === void 0 ? void 0 : act.type) === 'update_map')) return [3 /*break*/, 2];
                    mapContext.set({
                        lat: typeof act.lat === 'number' ? act.lat : mapContext.lat,
                        lon: typeof act.lon === 'number' ? act.lon : mapContext.lon,
                        zoom: typeof act.zoom === 'number' ? act.zoom : mapContext.zoom
                    });
                    return [3 /*break*/, 16];
                case 2:
                    if (!((act === null || act === void 0 ? void 0 : act.type) === 'show_pins' && Array.isArray(act.points))) return [3 /*break*/, 3];
                    points = act.points
                        .filter(function (p) { return Number.isFinite(p === null || p === void 0 ? void 0 : p.lat) && Number.isFinite(p === null || p === void 0 ? void 0 : p.lon); })
                        .map(function (p) { return ({
                        lat: p.lat,
                        lon: p.lon,
                        label: typeof p.label === 'string' ? p.label : undefined,
                        areaSqft: Number.isFinite(p === null || p === void 0 ? void 0 : p.area_sqft) ? p.area_sqft : undefined
                    }); });
                    open = Boolean(act.open) && points.length === 1 && typeof ((_a = act.points[0]) === null || _a === void 0 ? void 0 : _a.label) === 'string';
                    mapContext.set({ pins: points, focusPinLabel: open ? act.points[0].label : null });
                    return [3 /*break*/, 16];
                case 3:
                    if (!((act === null || act === void 0 ? void 0 : act.type) === 'clear_pins')) return [3 /*break*/, 4];
                    mapContext.set({ lastPins: mapContext.pins, pins: [] });
                    return [3 /*break*/, 16];
                case 4:
                    if (!((act === null || act === void 0 ? void 0 : act.type) === 'restore_pins')) return [3 /*break*/, 5];
                    mapContext.set({ pins: mapContext.lastPins });
                    return [3 /*break*/, 16];
                case 5:
                    if (!((act === null || act === void 0 ? void 0 : act.type) === 'todos_add' && Array.isArray(act.items))) return [3 /*break*/, 6];
                    titles = act.items.filter(function (s) { return typeof s === 'string' && s.trim(); });
                    if (titles.length)
                        todoContext.addMany(titles);
                    return [3 /*break*/, 16];
                case 6:
                    if (!((act === null || act === void 0 ? void 0 : act.type) === 'todos_mark' && Array.isArray(act.items))) return [3 /*break*/, 7];
                    for (_g = 0, _h = act.items; _g < _h.length; _g++) {
                        it = _h[_g];
                        if (typeof (it === null || it === void 0 ? void 0 : it.title) === 'string' && typeof (it === null || it === void 0 ? void 0 : it.done) === 'boolean') {
                            todoContext.markByTitle(it.title, it.done);
                        }
                    }
                    return [3 /*break*/, 16];
                case 7:
                    if (!((act === null || act === void 0 ? void 0 : act.type) === 'todos_remove' && Array.isArray(act.titles))) return [3 /*break*/, 8];
                    for (_j = 0, _k = act.titles; _j < _k.length; _j++) {
                        title = _k[_j];
                        if (typeof title === 'string')
                            todoContext.removeByTitle(title);
                    }
                    return [3 /*break*/, 16];
                case 8:
                    if (!((act === null || act === void 0 ? void 0 : act.type) === 'todos_rename' && typeof act.oldTitle === 'string' && typeof act.newTitle === 'string')) return [3 /*break*/, 9];
                    todoContext.renameByTitle(act.oldTitle, act.newTitle);
                    return [3 /*break*/, 16];
                case 9:
                    if (!((act === null || act === void 0 ? void 0 : act.type) === 'switch_tab' && typeof act.tab === 'string')) return [3 /*break*/, 10];
                    try {
                        ui.setActiveTab(act.tab);
                    }
                    catch (_m) { }
                    return [3 /*break*/, 16];
                case 10:
                    if (!((act === null || act === void 0 ? void 0 : act.type) === 'floorPlanner_render' && typeof act.instruction === 'string')) return [3 /*break*/, 16];
                    plannerContext.setLoading(true);
                    _l.label = 11;
                case 11:
                    _l.trys.push([11, 14, 15, 16]);
                    hasExistingSvg = typeof plannerContext.svgMarkup === 'string' && plannerContext.svgMarkup.trim().length > 0;
                    combinedInstruction = hasExistingSvg
                        ? act.instruction + "\n\nExisting SVG to refine (only svg element follows):\n" + plannerContext.svgMarkup
                        : act.instruction;
                    payload = {
                        output_type: 'chat',
                        input_type: 'chat',
                        input_value: combinedInstruction,
                        session_id: 'user_1'
                    };
                    headers = { 'Content-Type': 'application/json' };
                    apiKey = process.env.NEXT_PUBLIC_LANGFLOW_API_KEY;
                    if (apiKey)
                        headers['x-api-key'] = apiKey;
                    options = {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify(payload)
                    };
                    return [4 /*yield*/, fetch('http://localhost:7860/api/v1/run/e7b44d28-a5d8-42a8-ba9a-12c7608c824a', options)];
                case 12:
                    resp = _l.sent();
                    return [4 /*yield*/, resp.json()];
                case 13:
                    json = _l.sent();
                    if (!resp.ok)
                        throw new Error((json && (json.error || json.message)) || 'FloorPlanner render failed');
                    message = (_f = (_e = (_d = (_c = (_b = json === null || json === void 0 ? void 0 : json.outputs) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.outputs) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.artifacts) === null || _f === void 0 ? void 0 : _f.message;
                    svg = extractSvgElement(message || '');
                    plannerContext.setSvg(svg || 'Could not load SVG');
                    return [3 /*break*/, 16];
                case 14:
                    err_1 = _l.sent();
                    console.error(err_1);
                    return [3 /*break*/, 16];
                case 15:
                    plannerContext.setLoading(false);
                    return [7 /*endfinally*/];
                case 16:
                    _i++;
                    return [3 /*break*/, 1];
                case 17: return [2 /*return*/];
            }
        });
    });
}
exports.applyToolActions = applyToolActions;
