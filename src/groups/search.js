"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
const user_1 = __importDefault(require("../user"));
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
const database_1 = __importDefault(require("../database"));
function attachSearchFunctions(Groups) {
    Groups.search = async function (query, options = {}) {
        if (!query) {
            return [];
        }
        query = query.toLowerCase();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        let groupNames = Object.values(await database_1.default.getObject('groupslug:groupname'));
        if (!options.hideEphemeralGroups) {
            groupNames = Groups.ephemeralGroups.concat(groupNames);
        }
        groupNames = groupNames.filter((name) => name.toLowerCase().includes(query) && name !== Groups.BANNED_USERS);
        groupNames = groupNames.slice(0, 100);
        let groupsData;
        if (options.showMembers) {
            groupsData = await Groups.getGroupsAndMembers(groupNames);
        }
        else {
            groupsData = await Groups.getGroupsData(groupNames);
        }
        groupsData = groupsData.filter(Boolean);
        if (options.filterHidden) {
            groupsData = groupsData.filter(group => !group.hidden);
        }
        return Groups.sort(options.sort, groupsData) || []; // Ensure non-empty array return
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
    Groups.searchMembers = async function (data) {
        if (!data.query) {
            const users = await Groups.getOwnersAndMembers(data.groupName, data.uid, 0, 19);
            const matchCount = users.length;
            const timing = '0.00';
            return { users, matchCount, timing };
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const results = await user_1.default.search(Object.assign(Object.assign({}, data), { paginate: false, hardCap: -1 }));
        const uids = results.users.map(user => user === null || user === void 0 ? void 0 : user.uid);
        const isOwners = await Groups.ownership.isOwners(uids, data.groupName);
        results.users.forEach((user, index) => {
            if (user) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
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
    };
}
module.exports = attachSearchFunctions;
