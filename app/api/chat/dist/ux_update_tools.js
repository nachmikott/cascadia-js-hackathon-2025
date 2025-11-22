"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.createTools = exports.AGENT_INSTRUCTIONS = void 0;
var zod_1 = require("zod");
var agents_1 = require("@openai/agents");
var geo_1 = require("../../../lib/geo");
var parcels_1 = require("../../../lib/parcels");
exports.AGENT_INSTRUCTIONS = "You are a helpful assistant.\n- When the user references a location (city, address, or coordinates), call update_map with numeric lat/lon and optional zoom.\n- When the user asks about zoning and provides GPS coordinates, call lookupZoningByGPS with lat/lon and include the result.\n- When the user provides a parcel number (parcel_id), call lookupZoningByParcel to return the zoning for that parcel.\n- When the user asks for parcel options by size/zone (e.g., building a 10,000 sq ft home), call findParcelsByZone and ensure pins are updated on the map.\n- When the user asks to pin specific parcels (or follow-up refers to previously listed parcel IDs), call pinParcelsByIds to (re)pin them.\nOtherwise, reply normally.";
function createTools(req, toolActions) {
    var _this = this;
    // update_map
    var UpdateMapArgs = zod_1.z.object({
        lat: zod_1.z.coerce.number().min(-90).max(90),
        lon: zod_1.z.coerce.number().min(-180).max(180),
        zoom: zod_1.z.coerce.number().min(0).max(22).nullable()["default"](null)
    });
    var updateMap = agents_1.tool({
        name: 'update_map',
        description: 'Update the map center and optional zoom using GPS coordinates.',
        parameters: UpdateMapArgs,
        execute: function (args) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                toolActions.push(__assign({ type: 'update_map' }, args));
                return [2 /*return*/, "Centered map at " + args.lat + ", " + args.lon + (args.zoom != null ? " (zoom " + args.zoom + ")" : '') + "."];
            });
        }); }
    });
    // lookupZoningByGPS
    var LookupZoningByGPSArgs = zod_1.z.object({
        lat: zod_1.z.coerce.number().min(-90).max(90),
        lon: zod_1.z.coerce.number().min(-180).max(180)
    });
    var lookupZoningByGPS = agents_1.tool({
        name: 'lookupZoningByGPS',
        description: 'Given GPS coordinates (lat, lon), look up and describe the zoning at that point from local GeoJSON.',
        parameters: LookupZoningByGPSArgs,
        execute: function (_a) {
            var lat = _a.lat, lon = _a.lon;
            return __awaiter(_this, void 0, void 0, function () {
                var baseUrl, feature;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            baseUrl = new URL(req.url).origin;
                            return [4 /*yield*/, geo_1.findFeatureAt(lat, lon, baseUrl)];
                        case 1:
                            feature = _b.sent();
                            return [2 /*return*/, geo_1.describeZoningFromFeature(lat, lon, feature)];
                    }
                });
            });
        }
    });
    // lookupZoningByParcel
    var LookupZoningByParcelArgs = zod_1.z.object({ parcel_id: zod_1.z.string().min(3) });
    var lookupZoningByParcel = agents_1.tool({
        name: 'lookupZoningByParcel',
        description: 'Given a parcel number (parcel_id), find its coordinates and return the zoning at that location, and center the map there.',
        parameters: LookupZoningByParcelArgs,
        execute: function (_a) {
            var parcel_id = _a.parcel_id;
            return __awaiter(_this, void 0, void 0, function () {
                var rec, _b, lat, lon, baseUrl, feature, desc;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, parcels_1.getParcelXYFromJSON(parcel_id)];
                        case 1:
                            rec = _c.sent();
                            if (!rec)
                                return [2 /*return*/, "Parcel " + parcel_id + " not found."];
                            _b = parcels_1.spnToLonLat(rec.x_ft, rec.y_ft), lat = _b.lat, lon = _b.lon;
                            baseUrl = new URL(req.url).origin;
                            return [4 /*yield*/, geo_1.findFeatureAt(lat, lon, baseUrl)];
                        case 2:
                            feature = _c.sent();
                            desc = geo_1.describeZoningFromFeature(lat, lon, feature);
                            toolActions.push({ type: 'update_map', lat: lat, lon: lon });
                            return [2 /*return*/, "Parcel " + parcel_id + ": " + desc];
                    }
                });
            });
        }
    });
    // findParcelsByZone
    var FindParcelsArgs = zod_1.z.object({
        zoneQuery: zod_1.z.string().min(2).optional().nullable(),
        minAreaSqFt: zod_1.z.coerce.number().min(0).optional().nullable(),
        limit: zod_1.z.coerce.number().min(1).max(50).optional().nullable()
    });
    var findParcelsByZoneTool = agents_1.tool({
        name: 'findParcelsByZone',
        description: 'Search parcels across Snohomish County that match a zoning label/abbrev and a minimum lot size (GIS_SQ_FT). If zoneQuery is omitted, defaults to residential zones.',
        parameters: FindParcelsArgs,
        execute: function (_a) {
            var _b = _a.zoneQuery, zoneQuery = _b === void 0 ? null : _b, _c = _a.minAreaSqFt, minAreaSqFt = _c === void 0 ? null : _c, _d = _a.limit, limit = _d === void 0 ? null : _d;
            return __awaiter(_this, void 0, void 0, function () {
                var baseUrl, results, lines;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            baseUrl = new URL(req.url).origin;
                            return [4 /*yield*/, parcels_1.searchParcelsByZone({
                                    zoneQuery: zoneQuery,
                                    minAreaSqFt: minAreaSqFt !== null && minAreaSqFt !== void 0 ? minAreaSqFt : undefined,
                                    limit: limit !== null && limit !== void 0 ? limit : undefined,
                                    baseUrl: baseUrl
                                })];
                        case 1:
                            results = _e.sent();
                            if (!results.length)
                                return [2 /*return*/, 'No parcels matched the criteria.'];
                            toolActions.push({ type: 'clear_pins' });
                            toolActions.push({
                                type: 'show_pins',
                                points: results.map(function (r) { return ({ lat: r.lat, lon: r.lon, label: r.parcel_id, area_sqft: r.area_sqft }); })
                            });
                            lines = results.map(function (r, i) { return i + 1 + ". Parcel " + r.parcel_id + " \u2013 " + r.zoning_label + (r.zoning_abbrev ? " (" + r.zoning_abbrev + ")" : '') + ", " + Math.round(r.area_sqft).toLocaleString() + " sq ft at " + r.lat.toFixed(5) + ", " + r.lon.toFixed(5); });
                            return [2 /*return*/, "Top " + results.length + " parcels:\n" + lines.join('\n')];
                    }
                });
            });
        }
    });
    // pinParcelsByIds
    var PinParcelsArgs = zod_1.z.object({
        parcel_ids: zod_1.z.array(zod_1.z.string().min(3)).min(1),
        clearFirst: zod_1.z.boolean().optional().nullable()
    });
    var pinParcelsByIdsTool = agents_1.tool({
        name: 'pinParcelsByIds',
        description: 'Given a list of parcel_ids, resolve their coordinates from parcel-info.json and pin them on the map. Optionally clear existing pins first.',
        parameters: PinParcelsArgs,
        execute: function (_a) {
            var parcel_ids = _a.parcel_ids, _b = _a.clearFirst, clearFirst = _b === void 0 ? true : _b;
            return __awaiter(_this, void 0, void 0, function () {
                var rows;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, parcels_1.getParcelsByIds(parcel_ids)];
                        case 1:
                            rows = _c.sent();
                            if (!rows.length)
                                return [2 /*return*/, 'No valid parcels resolved to coordinates.'];
                            if (clearFirst)
                                toolActions.push({ type: 'clear_pins' });
                            toolActions.push({
                                type: 'show_pins',
                                points: rows.map(function (r) { var _a; return ({ lat: r.lat, lon: r.lon, label: r.parcel_id, area_sqft: (_a = r.area_sqft) !== null && _a !== void 0 ? _a : undefined }); })
                            });
                            return [2 /*return*/, "Pinned " + rows.length + " parcel" + (rows.length === 1 ? '' : 's') + " on the map."];
                    }
                });
            });
        }
    });
    return [updateMap, lookupZoningByGPS, lookupZoningByParcel, findParcelsByZoneTool, pinParcelsByIdsTool];
}
exports.createTools = createTools;
