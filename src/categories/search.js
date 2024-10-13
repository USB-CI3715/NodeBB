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
exports.default = default_1;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
var _ = require("lodash");
var privileges = require("../privileges");
var plugins = require("../plugins");
var db = require("../database");
function default_1(Categories) {
    Categories.search = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var query, page, uid, paginate, startTime, cids, result, searchResult, resultsPerPage, start, stop_1, childrenCids, uniqCids, categoryData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = data.query || '';
                        page = data.page || 1;
                        uid = data.uid || 0;
                        paginate = data.hasOwnProperty('paginate') ? data.paginate : true;
                        startTime = process.hrtime();
                        return [4 /*yield*/, findCids(query, data.hardCap)];
                    case 1:
                        cids = _a.sent();
                        return [4 /*yield*/, plugins.hooks.fire('filter:categories.search', {
                                data: data,
                                cids: cids,
                                uid: uid,
                            })];
                    case 2:
                        result = _a.sent();
                        return [4 /*yield*/, privileges.categories.filterCids('find', result.cids, uid)];
                    case 3:
                        cids = _a.sent();
                        searchResult = {
                            matchCount: cids.length,
                        };
                        if (paginate) {
                            resultsPerPage = data.resultsPerPage || 50;
                            start = Math.max(0, page - 1) * resultsPerPage;
                            stop_1 = start + resultsPerPage;
                            searchResult.pageCount = Math.ceil(cids.length / resultsPerPage);
                            cids = cids.slice(start, stop_1);
                        }
                        return [4 /*yield*/, getChildrenCids(cids, uid)];
                    case 4:
                        childrenCids = _a.sent();
                        uniqCids = _.uniq(cids.concat(childrenCids));
                        return [4 /*yield*/, Categories.getCategories(uniqCids)];
                    case 5:
                        categoryData = _a.sent();
                        Categories.getTree(categoryData, 0);
                        return [4 /*yield*/, Categories.getRecentTopicReplies(categoryData, uid, data.qs)];
                    case 6:
                        _a.sent();
                        categoryData.forEach(function (category) {
                            if (category && Array.isArray(category.children)) {
                                category.children = category.children.slice(0, category.subCategoriesPerPage);
                                category.children.forEach(function (child) {
                                    child.children = undefined;
                                });
                            }
                        });
                        categoryData.sort(function (c1, c2) {
                            if (c1.parentCid !== c2.parentCid) {
                                return c1.parentCid - c2.parentCid;
                            }
                            return c1.order - c2.order;
                        });
                        searchResult.timing = (process.hrtime(startTime)[1] / 1000000).toFixed(2);
                        searchResult.categories = categoryData.filter(function (c) { return cids.includes(c.cid); });
                        return [2 /*return*/, searchResult];
                }
            });
        });
    };
    function findCids(query, hardCap) {
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!query || String(query).length < 2) {
                            return [2 /*return*/, []];
                        }
                        return [4 /*yield*/, db.getSortedSetScan({
                                key: 'categories:name',
                                match: "*".concat(query.toLowerCase(), "*"),
                                limit: hardCap || 500,
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data.map(function (data) { return parseInt(data.split(':').pop(), 10); })];
                }
            });
        });
    }
    function getChildrenCids(cids, uid) {
        return __awaiter(this, void 0, void 0, function () {
            var childrenCids;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(cids.map(function (cid) { return Categories.getChildrenCids(cid); }))];
                    case 1:
                        childrenCids = _a.sent();
                        return [4 /*yield*/, privileges.categories.filterCids('find', _.flatten(childrenCids), uid)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    }
}
;
