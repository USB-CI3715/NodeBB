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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
const user_1 = __importDefault(require("../user"));
const database_1 = __importDefault(require("../database"));
const groupsController = module.exports;
function attachSearchFunctions(Groups) {
    Groups.search = function (query, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!query) {
                return [];
            }
            query = query.toLowerCase();
            let groupNames = Object.values(yield database_1.default.getObject('groupslug:groupname'));
            if (!options.hideEphemeralGroups) {
                groupNames = Groups.ephemeralGroups.concat(groupNames);
            }
            groupNames = groupNames.filter((name) => name.toLowerCase().includes(query) && name !== Groups.BANNED_USERS // hide banned-users in searches
            );
            groupNames = groupNames.slice(0, 100);
            let groupsData;
            if (options.showMembers) {
                groupsData = yield Groups.getGroupsAndMembers(groupNames);
            }
            else {
                groupsData = yield Groups.getGroupsData(groupNames);
            }
            groupsData = groupsData.filter(Boolean);
            if (options.filterHidden) {
                groupsData = groupsData.filter(group => !group.hidden);
            }
            return Groups.sort(options.sort, groupsData) || []; // Ensure non-empty array return
        });
    };
    Groups.sort = function (strategy, groups) {
        switch (strategy) {
            case 'count':
                groups.sort((a, b) => a.slug.localeCompare(b.slug))
                    .sort((a, b) => b.memberCount - a.memberCount);
                break;
            case 'date':
                groups.sort((a, b) => b.createtime - a.createtime);
                break;
            case 'alpha': // intentional fall-through
            default:
                groups.sort((a, b) => (a.slug > b.slug ? 1 : -1));
        }
        return groups;
    };
    Groups.searchMembers = function (data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!data.query) {
                const users = yield Groups.getOwnersAndMembers(data.groupName, data.uid, 0, 19);
                const matchCount = users.length;
                const timing = '0.00';
                return { users, matchCount, timing };
            }
            const results = yield user_1.default.search(Object.assign(Object.assign({}, data), { paginate: false, hardCap: -1 }));
            const uids = results.users.map(user => user === null || user === void 0 ? void 0 : user.uid);
            const isOwners = yield Groups.ownership.isOwners(uids, data.groupName);
            results.users.forEach((user, index) => {
                if (user) {
                    user.isOwner = isOwners[index];
                }
            });
            results.users.sort((a, b) => {
                if ((a === null || a === void 0 ? void 0 : a.isOwner) && !(b === null || b === void 0 ? void 0 : b.isOwner)) {
                    return -1;
                }
                else if (!(a === null || a === void 0 ? void 0 : a.isOwner) && (b === null || b === void 0 ? void 0 : b.isOwner)) {
                    return 1;
                }
                return 0;
            });
            return results;
        });
    };
}
exports.default = attachSearchFunctions;
