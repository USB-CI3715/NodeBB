"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const meta_1 = __importDefault(require("../meta"));
const plugins = __importStar(require("../plugins"));
const slugify_1 = __importDefault(require("../slugify"));
const db = __importStar(require("../database"));
function createGroup(Groups) {
    function isSystemGroup(data) {
        return data.system === true || parseInt(data.system, 10) === 1 ||
            Groups.systemGroups.includes(data.name) ||
            Groups.isPrivilegeGroup(data.name);
    }
    async function privilegeGroupExists(name) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return Groups.isPrivilegeGroup(name) && await db.isSortedSetMember('groups:createtime', name);
    }
    Groups.create = async function (data) {
        const isSystem = isSystemGroup(data);
        const timestamp = data.timestamp || Date.now();
        let disableJoinRequests = parseInt(data.disableJoinRequests, 10) === 1 ? 1 : 0;
        if (data.name === 'administrators') {
            disableJoinRequests = 1;
        }
        const disableLeave = parseInt(data.disableLeave, 10) === 1 ? 1 : 0;
        const isHidden = parseInt(data.hidden, 10) === 1;
        Groups.validateGroupName(data.name);
        const [exists, privGroupExists] = await Promise.all([
            meta_1.default.userOrGroupExists(data.name),
            privilegeGroupExists(data.name),
        ]);
        if (exists || privGroupExists) {
            throw new Error('[[error:group-already-exists]]');
        }
        const memberCount = data.hasOwnProperty('ownerUid') ? 1 : 0;
        const isPrivate = data.hasOwnProperty('private') && data.private !== undefined ? parseInt(data.private, 10) === 1 : true;
        let groupData = {
            name: data.name,
            slug: (0, slugify_1.default)(data.name),
            createtime: timestamp,
            userTitle: data.userTitle || data.name,
            userTitleEnabled: parseInt(data.userTitleEnabled, 10) === 1 ? 1 : 0,
            description: data.description || '',
            memberCount: memberCount,
            hidden: isHidden ? 1 : 0,
            system: isSystem ? 1 : 0,
            private: isPrivate ? 1 : 0,
            disableJoinRequests: disableJoinRequests,
            disableLeave: disableLeave,
        };
        await plugins.hooks.fire('filter:group.create', { group: groupData, data: data });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await db.sortedSetAdd('groups:createtime', groupData.createtime, groupData.name);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await db.setObject(`group:${groupData.name}`, groupData);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (data.hasOwnProperty('ownerUid')) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            await db.setAdd(`group:${groupData.name}:owners`, data.ownerUid);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            await db.sortedSetAdd(`group:${groupData.name}:members`, timestamp, data.ownerUid);
        }
        if (!isHidden && !isSystem) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            await db.sortedSetAddBulk([
                ['groups:visible:createtime', timestamp, groupData.name],
                ['groups:visible:memberCount', groupData.memberCount, groupData.name],
                ['groups:visible:name', 0, `${groupData.name.toLowerCase()}:${groupData.name}`],
            ]);
        }
        if (!Groups.isPrivilegeGroup(groupData.name)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            await db.setObjectField('groupslug:groupname', groupData.slug, groupData.name);
        }
        groupData = await Groups.getGroupData(groupData.name);
        await plugins.hooks.fire('action:group.create', { group: groupData });
        return groupData;
    };
    Groups.validateGroupName = function (name) {
        if (!name) {
            throw new Error('[[error:group-name-too-short]]');
        }
        if (typeof name !== 'string') {
            throw new Error('[[error:invalid-group-name]]');
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!Groups.isPrivilegeGroup(name) && name.length > meta_1.default.config.maximumGroupNameLength) {
            throw new Error('[[error:group-name-too-long]]');
        }
        if (name === 'guests' || (!Groups.isPrivilegeGroup(name) && name.includes(':'))) {
            throw new Error('[[error:invalid-group-name]]');
        }
        if (name.includes('/') || !(0, slugify_1.default)(name)) {
            throw new Error('[[error:invalid-group-name]]');
        }
    };
}
module.exports = createGroup;
