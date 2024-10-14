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
        var isMember;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.isSetMember('conditions:active', condition)];
                case 1:
                    isMember = _a.sent();
                    return [2 /*return*/, isMember];
            }
        });
    });
}
function getIDsByCondition(condition) {
    return __awaiter(this, void 0, void 0, function () {
        var members;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.getSetMembers("condition:".concat(condition, ":rewards"))];
                case 1:
                    members = _a.sent();
                    return [2 /*return*/, members];
            }
        });
    });
}
function filterCompletedRewards(uid, rewards) {
    return __awaiter(this, void 0, void 0, function () {
        var data, userRewards;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.getSortedSetRangeByScoreWithScores("uid:".concat(uid, ":rewards"), 0, -1, 1, '+inf')];
                case 1:
                    data = _a.sent();
                    userRewards = {};
                    data.forEach(function (obj) {
                        userRewards[obj.value] = parseInt(obj.score, 10);
                    });
                    return [2 /*return*/, rewards.filter(function (reward) {
                            if (!reward) {
                                return false;
                            }
                            var claimable = parseInt(reward.claimable, 10);
                            return claimable === 0 || (!userRewards[reward.id] || userRewards[reward.id] < claimable);
                        })];
            }
        });
    });
}
function getRewardDataByIDs(ids) {
    return __awaiter(this, void 0, void 0, function () {
        var rewardsData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.getObjects(ids.map(function (id) { return "rewards:id:".concat(id); }))];
                case 1:
                    rewardsData = _a.sent();
                    return [2 /*return*/, rewardsData];
            }
        });
    });
}
function getRewardsByRewardData(rewards) {
    return __awaiter(this, void 0, void 0, function () {
        var rewardObjects;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.getObjects(rewards.map(function (reward) { return "rewards:id:".concat(reward.id, ":rewards"); }))];
                case 1:
                    rewardObjects = _a.sent();
                    return [2 /*return*/, rewardObjects];
            }
        });
    });
}
function checkCondition(reward, method) {
    return __awaiter(this, void 0, void 0, function () {
        var value, bool;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
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
            }
        });
    });
}
function giveRewards(uid, rewards) {
    return __awaiter(this, void 0, void 0, function () {
        var rewardData, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getRewardsByRewardData(rewards)];
                case 1:
                    rewardData = _a.sent();
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < rewards.length)) return [3 /*break*/, 6];
                    /* eslint-disable no-await-in-loop */
                    return [4 /*yield*/, plugins.hooks.fire("action:rewards.award:".concat(rewards[i].id), {
                            uid: uid,
                            rewardData: rewards[i],
                            reward: rewardData[i],
                        })];
                case 3:
                    /* eslint-disable no-await-in-loop */
                    _a.sent();
                    return [4 /*yield*/, db.sortedSetIncrBy("uid:".concat(uid, ":rewards"), 1, rewards[i].id)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    i++;
                    return [3 /*break*/, 2];
                case 6: return [2 /*return*/];
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
                        return [4 /*yield*/, isConditionActive(condition)];
                    case 1:
                        isActive = _a.sent();
                        if (!isActive) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, getIDsByCondition(condition)];
                    case 2:
                        ids = _a.sent();
                        return [4 /*yield*/, getRewardDataByIDs(ids)];
                    case 3:
                        rewardData = _a.sent();
                        // Filtrar los deshabilitados
                        rewardData = rewardData.filter(function (r) { return r && !(r.disabled === 'true' || r.disabled === true); });
                        return [4 /*yield*/, filterCompletedRewards(uid, rewardData)];
                    case 4:
                        rewardData = _a.sent();
                        if (!rewardData || !rewardData.length) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, Promise.all(rewardData.map(function (reward) { return checkCondition(reward, method); }))];
                    case 5:
                        eligible = _a.sent();
                        eligibleRewards = rewardData.filter(function (reward, index) { return eligible[index]; });
                        return [4 /*yield*/, giveRewards(uid, eligibleRewards)];
                    case 6:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    },
};
(0, promisify_1.default)(rewards);
module.exports = rewards;
