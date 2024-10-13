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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectInvite = exports.acceptInvite = exports.issueInvite = exports.getInvites = exports.reject = exports.accept = exports.getPending = exports.rescind = exports.grant = exports.leave = exports.join = exports.listMembers = exports.delete = exports.deleteGroup = exports.update = exports.create = exports.exists = exports.list = void 0;
/* eslint-disable import/no-import-module-exports */
var api_1 = require("../../api");
/* eslint-disable import/no-import-module-exports */
var helpers_1 = require("../helpers");
var list = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _b = (_a = helpers_1.default).formatApiResponse;
                _c = [200, res];
                return [4 /*yield*/, api_1.default.groups.list(req, __assign({}, req.query))];
            case 1: 
            // The following line calls a function in a module that hasn't been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return [4 /*yield*/, _b.apply(_a, _c.concat([_d.sent()]))];
            case 2:
                // The following line calls a function in a module that hasn't been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _d.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.list = list;
var exists = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return [4 /*yield*/, helpers_1.default.formatApiResponse(200, res)];
            case 1:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.exists = exists;
// export const create es una funcion que tiene como fin
var create = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var groupData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, api_1.default.groups.create(req, req.body)];
            case 1:
                groupData = _a.sent();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                return [4 /*yield*/, helpers_1.default.formatApiResponse(200, res, groupData)];
            case 2:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.create = create;
var update = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var groupObj;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, api_1.default.groups.update(req, __assign(__assign({}, req.body), { slug: req.params.slug }))];
            case 1:
                groupObj = _a.sent();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                return [4 /*yield*/, helpers_1.default.formatApiResponse(200, res, groupObj)];
            case 2:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.update = update;
var deleteGroup = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return [4 /*yield*/, api_1.default.groups.delete(req, req.params)];
            case 1:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                return [4 /*yield*/, helpers_1.default.formatApiResponse(200, res)];
            case 2:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.deleteGroup = deleteGroup;
exports.delete = exports.deleteGroup;
var listMembers = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var slug, _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                slug = req.params.slug;
                _b = (_a = helpers_1.default).formatApiResponse;
                _c = [200, res];
                return [4 /*yield*/, api_1.default.groups.listMembers(req, __assign(__assign({}, req.query), { slug: slug }))];
            case 1: 
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return [4 /*yield*/, _b.apply(_a, _c.concat([_d.sent()]))];
            case 2:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _d.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.listMembers = listMembers;
var join = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return [4 /*yield*/, api_1.default.groups.join(req, req.params)];
            case 1:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                return [4 /*yield*/, helpers_1.default.formatApiResponse(200, res)];
            case 2:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.join = join;
var leave = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return [4 /*yield*/, api_1.default.groups.leave(req, req.params)];
            case 1:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                return [4 /*yield*/, helpers_1.default.formatApiResponse(200, res)];
            case 2:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.leave = leave;
var grant = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return [4 /*yield*/, api_1.default.groups.grant(req, req.params)];
            case 1:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                return [4 /*yield*/, helpers_1.default.formatApiResponse(200, res)];
            case 2:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.grant = grant;
var rescind = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return [4 /*yield*/, api_1.default.groups.rescind(req, req.params)];
            case 1:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                return [4 /*yield*/, helpers_1.default.formatApiResponse(200, res)];
            case 2:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.rescind = rescind;
var getPending = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var pending;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, api_1.default.groups.getPending(req, req.params)];
            case 1:
                pending = _a.sent();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                return [4 /*yield*/, helpers_1.default.formatApiResponse(200, res, { pending: pending })];
            case 2:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.getPending = getPending;
var accept = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return [4 /*yield*/, api_1.default.groups.accept(req, req.params)];
            case 1:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                return [4 /*yield*/, helpers_1.default.formatApiResponse(200, res)];
            case 2:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.accept = accept;
var reject = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return [4 /*yield*/, api_1.default.groups.reject(req, req.params)];
            case 1:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                return [4 /*yield*/, helpers_1.default.formatApiResponse(200, res)];
            case 2:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.reject = reject;
var getInvites = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var invites;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, api_1.default.groups.getInvites(req, req.params)];
            case 1:
                invites = _a.sent();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                return [4 /*yield*/, helpers_1.default.formatApiResponse(200, res, { invites: invites })];
            case 2:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.getInvites = getInvites;
var issueInvite = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return [4 /*yield*/, api_1.default.groups.issueInvite(req, req.params)];
            case 1:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                return [4 /*yield*/, helpers_1.default.formatApiResponse(200, res)];
            case 2:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.issueInvite = issueInvite;
var acceptInvite = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return [4 /*yield*/, api_1.default.groups.acceptInvite(req, req.params)];
            case 1:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                return [4 /*yield*/, helpers_1.default.formatApiResponse(200, res)];
            case 2:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.acceptInvite = acceptInvite;
var rejectInvite = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return [4 /*yield*/, api_1.default.groups.rejectInvite(req, req.params)];
            case 1:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                return [4 /*yield*/, helpers_1.default.formatApiResponse(200, res)];
            case 2:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.rejectInvite = rejectInvite;
