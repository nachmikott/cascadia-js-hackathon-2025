"use strict";
exports.__esModule = true;
exports.setLoading = exports.setSvg = exports.applyOps = exports.setAll = void 0;
exports.setAll = function (next) { return ({ type: 'setAll', next: next }); };
exports.applyOps = function (ops) { return ({ type: 'applyOps', ops: ops }); };
exports.setSvg = function (svg) { return ({ type: 'setSvg', svg: svg }); };
exports.setLoading = function (value) { return ({ type: 'setLoading', value: value }); };
