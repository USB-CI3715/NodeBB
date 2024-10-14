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
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
var util = require("util");
var db = require("../database");
var plugins = require("../plugins");
var promisify_1 = require("../promisify");
function isConditionActive(condition) {
    return __awaiter(this, void 0, void 0, function () {
        var isMember, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db.isSetMember('conditions:active', condition)];
                case 1:
                    isMember = _a.sent();
                    return [2 /*return*/, isMember];
                case 2:
                    err_1 = _a.sent();
                    console.error('Error in isConditionActive: ', err_1);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getIDsByCondition(condition) {
    return __awaiter(this, void 0, void 0, function () {
        var members, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db.getSetMembers("condition:".concat(condition, ":rewards"))];
                case 1:
                    members = _a.sent();
                    return [2 /*return*/, members];
                case 2:
                    err_2 = _a.sent();
                    console.error('Error in getIDsByCondition: ', err_2);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function filterCompletedRewards(uid, rewards) {
    return __awaiter(this, void 0, void 0, function () {
        var data, userRewards_1, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db.getSortedSetRangeByScoreWithScores("uid:".concat(uid, ":rewards"), 0, -1, 1, '+inf')];
                case 1:
                    data = _a.sent();
                    userRewards_1 = {};
                    data.forEach(function (obj) {
                        userRewards_1[obj.value] = parseInt(obj.score, 10);
                    });
                    return [2 /*return*/, rewards.filter(function (reward) {
                            if (!reward) {
                                return false;
                            }
                            var claimable = parseInt(reward.claimable, 10);
                            return claimable === 0 || (!userRewards_1[reward.id] || userRewards_1[reward.id] < claimable);
                        })];
                case 2:
                    err_3 = _a.sent();
                    console.error('Error filtering completed rewards: ', err_3);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getRewardDataByIDs(ids) {
    return __awaiter(this, void 0, void 0, function () {
        var rewardsData, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db.getObjects(ids.map(function (id) { return "rewards:id:".concat(id); }))];
                case 1:
                    rewardsData = _a.sent();
                    return [2 /*return*/, rewardsData];
                case 2:
                    err_4 = _a.sent();
                    console.error('Error in getRewardDataByIDs: ', err_4);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getRewardsByRewardData(rewards) {
    return __awaiter(this, void 0, void 0, function () {
        var rewardObjects, err_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db.getObjects(rewards.map(function (reward) { return "rewards:id:".concat(reward.id, ":rewards"); }))];
                case 1:
                    rewardObjects = _a.sent();
                    return [2 /*return*/, rewardObjects];
                case 2:
                    err_5 = _a.sent();
                    console.error('Error in getRewardsByRewardData: ', err_5);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function checkCondition(reward, method) {
    return __awaiter(this, void 0, void 0, function () {
        var value, bool, err_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    if (method.constructor && method.constructor.name !== 'AsyncFunction') {
                        method = util.promisify(method);
                    }
                    return [4 /*yield*/, method()];
                case 1:
                    value = _a.sent();
                    return [4 /*yield*/, plugins.hooks.fire("filter:rewards.checkConditional:".concat(reward.conditional), { left: value, right: reward.value })];
                case 2:
                    bool = _a.sent();
                    return [2 /*return*/, bool];
                case 3:
                    err_6 = _a.sent();
                    console.error("Error in checkCondition for reward ".concat(reward.id, ":"), err_6);
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function giveRewards(uid, rewards) {
    return __awaiter(this, void 0, void 0, function () {
        var rewardData;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getRewardsByRewardData(rewards)];
                case 1:
                    rewardData = _a.sent();
                    // Ejecutar en paralelo las operaciones de dar premios
                    return [4 /*yield*/, Promise.all(rewards.map(function (reward, i) { return __awaiter(_this, void 0, void 0, function () {
                            var err_7;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 3, , 4]);
                                        return [4 /*yield*/, plugins.hooks.fire("action:rewards.award:".concat(reward.id), {
                                                uid: uid,
                                                rewardData: reward,
                                                reward: rewardData[i],
                                            })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, db.sortedSetIncrBy("uid:".concat(uid, ":rewards"), 1, reward.id)];
                                    case 2:
                                        _a.sent();
                                        return [3 /*break*/, 4];
                                    case 3:
                                        err_7 = _a.sent();
                                        console.error("Error awarding reward ".concat(reward.id, ":"), err_7);
                                        return [3 /*break*/, 4];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 2:
                    // Ejecutar en paralelo las operaciones de dar premios
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
var rewards = {
    checkConditionAndRewardUser: function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var uid, condition, method, isActive, ids, rewardData, eligible, eligibleRewards;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        uid = params.uid, condition = params.condition, method = params.method;
                        console.log('Starting to check condition for user:', uid);
                        return [4 /*yield*/, isConditionActive(condition)];
                    case 1:
                        isActive = _a.sent();
                        console.log('Condition active:', isActive);
                        if (!isActive) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, getIDsByCondition(condition)];
                    case 2:
                        ids = _a.sent();
                        console.log('Condition IDs retrieved:', ids);
                        return [4 /*yield*/, getRewardDataByIDs(ids)];
                    case 3:
                        rewardData = _a.sent();
                        // Filtrar los deshabilitados
                        rewardData = rewardData.filter(function (r) { return r && !(r.disabled === 'true' || r.disabled === true); });
                        console.log('Filtered disabled rewards:', rewardData);
                        return [4 /*yield*/, filterCompletedRewards(uid, rewardData)];
                    case 4:
                        rewardData = _a.sent();
                        if (!rewardData || !rewardData.length) {
                            console.log('No eligible rewards left after filtering completed rewards.');
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, Promise.all(rewardData.map(function (reward) { return checkCondition(reward, method); }))];
                    case 5:
                        eligible = _a.sent();
                        eligibleRewards = rewardData.filter(function (reward, index) { return eligible[index]; });
                        if (!(eligibleRewards.length > 0)) return [3 /*break*/, 7];
                        return [4 /*yield*/, giveRewards(uid, eligibleRewards)];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7: return [2 /*return*/];
                }
            });
        });
    },
};
// Modificación de la promesa para incluir el manejo del error con .catch(done)
(0, promisify_1.default)(rewards);
module.exports = rewards;
