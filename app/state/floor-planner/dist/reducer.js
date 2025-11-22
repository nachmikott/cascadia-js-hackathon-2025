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
exports.floorPlannerReducer = exports.initialFloorPlannerState = void 0;
var uid = function () { return Math.random().toString(36).slice(2, 9); };
exports.initialFloorPlannerState = {
    svgMarkup: '',
    loading: false
};
exports.floorPlannerReducer = function (state, action) {
    switch (action.type) {
        case 'setSvg':
            return __assign(__assign({}, state), { svgMarkup: action.svg });
        case 'setLoading':
            return __assign(__assign({}, state), { loading: action.value });
        default:
            return state;
    }
};
