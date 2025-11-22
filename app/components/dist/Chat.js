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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var react_1 = require("react");
var MapContext_1 = require("../state/MapContext");
var TodoContext_1 = require("../state/TodoContext");
var FloorPlannerContext_1 = require("../state/FloorPlannerContext");
var UiContext_1 = require("../state/UiContext");
var applyToolActions_1 = require("../lib/applyToolActions");
var Chat = function () {
    var _a = react_1.useState([
        { id: 1, role: 'assistant', content: "Hello! I'm your home building assistant! Let's build your dream home! For our purposes, we are focused on Snohomish County. How can I help?" }
    ]), messages = _a[0], setMessages = _a[1];
    var _b = react_1.useState(''), input = _b[0], setInput = _b[1];
    var _c = react_1.useState(false), loading = _c[0], setLoading = _c[1];
    var _d = react_1.useState(null), error = _d[0], setError = _d[1];
    var endRef = react_1.useRef(null);
    var mapContext = MapContext_1.useMapContext();
    var todoContext = TodoContext_1.useTodoContext();
    var plannerContext = FloorPlannerContext_1.useFloorPlannerContext();
    var uiContext = UiContext_1.useUiContext();
    var activeTab = uiContext.state.activeTab;
    var extractSvgElement = function (input) {
        var svgMatch = input.match(/<svg[\s\S]*?<\/svg>/);
        return svgMatch ? svgMatch[0] : '';
    };
    react_1.useEffect(function () {
        var _a;
        (_a = endRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    var handleSubmit = function (event) { return __awaiter(void 0, void 0, void 0, function () {
        var text, nextId, userMsg, payload, plannerHasSvg, body, res, data, replyMsg_1, err_1, message;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    event.preventDefault();
                    text = input.trim();
                    if (!text || loading)
                        return [2 /*return*/];
                    setError(null);
                    nextId = messages.length ? Math.max.apply(Math, messages.map(function (message) { return message.id; })) + 1 : 1;
                    userMsg = { id: nextId, role: 'user', content: text };
                    setMessages(function (prev) { return __spreadArrays(prev, [userMsg]); });
                    setInput('');
                    setLoading(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, 7, 8]);
                    payload = __spreadArrays(messages, [userMsg]).map(function (m) { return ({ role: m.role, content: m.content }); });
                    plannerHasSvg = typeof plannerContext.svgMarkup === 'string' && plannerContext.svgMarkup.trim().length > 0;
                    body = JSON.stringify({
                        messages: payload,
                        todos: todoContext.items.map(function (it) { return ({ title: it.title, done: it.done }); }),
                        activeTab: activeTab,
                        plannerHasSvg: plannerHasSvg
                    });
                    return [4 /*yield*/, fetch('/api/chat', {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: body
                        })];
                case 2:
                    res = _b.sent();
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _b.sent();
                    if (!res.ok)
                        throw new Error((data === null || data === void 0 ? void 0 : data.error) || 'Request failed');
                    replyMsg_1 = { id: nextId + 1, role: 'assistant', content: (_a = data.reply) !== null && _a !== void 0 ? _a : '', meta: { agent: activeTab === 'todos' ? 'todo' : 'builder' } };
                    setMessages(function (prev) { return __spreadArrays(prev, [replyMsg_1]); });
                    if (!Array.isArray(data.toolActions)) return [3 /*break*/, 5];
                    return [4 /*yield*/, applyToolActions_1.applyToolActions(data.toolActions, {
                            mapContext: mapContext,
                            todoContext: todoContext,
                            plannerContext: plannerContext,
                            uiContext: uiContext,
                            extractSvgElement: extractSvgElement
                        })];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5: return [3 /*break*/, 8];
                case 6:
                    err_1 = _b.sent();
                    message = err_1 instanceof Error ? err_1.message : 'Something went wrong';
                    setError(message);
                    return [3 /*break*/, 8];
                case 7:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    return (React.createElement("div", { className: "chat" },
        React.createElement("div", { className: "chat-window", role: "log", "aria-live": "polite" },
            messages.map(function (m) {
                var _a;
                var isAssistant = m.role === 'assistant';
                var agent = (_a = m.meta) === null || _a === void 0 ? void 0 : _a.agent;
                var icon = isAssistant ? (agent === 'todo' ? 'pencil' : 'builder') : 'user';
                return (React.createElement("div", { key: m.id, className: "message " + m.role },
                    React.createElement("div", { className: "icon " + (isAssistant ? (agent || '') : 'user'), "aria-hidden": true }, icon === 'pencil' ? (React.createElement("img", { className: "icon-img", src: "/pencil.svg", alt: "" })) : icon === 'builder' ? (React.createElement("span", null, "\uD83C\uDFD7\uFE0F")) : (React.createElement("span", null, "\uD83D\uDE42"))),
                    React.createElement("div", { className: "bubble" }, m.content)));
            }),
            loading && (React.createElement("div", { className: "message assistant" },
                React.createElement("div", { className: "bubble" }, "Thinking\u2026"))),
            error && (React.createElement("div", { className: "message assistant" },
                React.createElement("div", { className: "bubble" },
                    "Error: ",
                    error))),
            React.createElement("div", { ref: endRef })),
        React.createElement("form", { className: "input-row", onSubmit: handleSubmit },
            React.createElement("input", { type: "text", placeholder: "Ask about patterns, tools, or ideas...", value: input, onChange: function (e) { return setInput(e.target.value); }, "aria-label": "Message", disabled: loading }),
            React.createElement("button", { type: "submit", disabled: loading, "aria-label": "Send message", className: "icon-btn primary" },
                React.createElement("span", { "aria-hidden": true }, "\u27A4")))));
};
exports["default"] = Chat;
