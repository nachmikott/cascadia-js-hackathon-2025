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
exports.__esModule = true;
exports.mapReducer = exports.initialMapState = void 0;
exports.initialMapState = {
    lat: 47.6062,
    lon: -122.3321,
    zoom: 12,
    pins: [],
    lastPins: [],
    focusPinLabel: null,
    // Placeholder; provider replaces with dispatch-backed fn
    set: function () { }
};
exports.mapReducer = function (state, action) {
    switch (action.type) {
        case 'set':
            return __assign(__assign({}, state), action.next);
        case 'setCenter':
            return __assign(__assign({}, state), { lat: action.lat, lon: action.lon });
        case 'setZoom':
            return __assign(__assign({}, state), { zoom: action.zoom });
        case 'setPins':
            return __assign(__assign({}, state), { pins: action.pins });
        case 'clearPinsKeepLast':
            return __assign(__assign({}, state), { lastPins: state.pins, pins: [] });
        case 'restorePins':
            return __assign(__assign({}, state), { pins: state.lastPins });
        case 'focus':
            return __assign(__assign({}, state), { focusPinLabel: action.label });
        default:
            return state;
    }
};
