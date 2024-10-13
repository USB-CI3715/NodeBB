import meta from '../meta';
import * as plugins from '../plugins';
import slugify from '../slugify';
import * as db from '../database';

interface GroupData {
	name: string;
	timestamp?: number;
	disableJoinRequests?: string | number;
	disableLeave?: string | number;
	hidden?: string | number;
	userTitle?: string;
	userTitleEnabled?: string | number;
	description?: string;
	ownerUid?: number;
	private?: string | number;
	system?: string | number | boolean;
}

interface GroupDataComplete {
	name: string;
	slug: string;
	createtime: number;
	userTitle: string;
	userTitleEnabled: number;
	description: string;
	memberCount: number;
	hidden: number;
	system: number;
	private: number;
	disableJoinRequests: number;
	disableLeave: number;
}

interface GroupsInterface {
	create: (data: GroupData) => Promise<GroupDataComplete>;
	validateGroupName: (name: string) => void;
	systemGroups: string[];
	isPrivilegeGroup: (name: string) => boolean;
	getGroupData: (name: string) => Promise<GroupDataComplete>;
}

function createGroup(Groups: GroupsInterface) {
	function isSystemGroup(data: GroupData): boolean {
		return data.system === true || parseInt(data.system as string, 10) === 1 ||
			Groups.systemGroups.includes(data.name) ||
			Groups.isPrivilegeGroup(data.name);
	}

	async function privilegeGroupExists(name: string): Promise<boolean> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		return Groups.isPrivilegeGroup(name) && await db.isSortedSetMember('groups:createtime', name) as boolean;
	}

	Groups.create = async function (data: GroupData): Promise<GroupDataComplete> {
		const isSystem = isSystemGroup(data);
		const timestamp = data.timestamp || Date.now();
		let disableJoinRequests = parseInt(data.disableJoinRequests as string, 10) === 1 ? 1 : 0;
		if (data.name === 'administrators') {
			disableJoinRequests = 1;
		}
		const disableLeave = parseInt(data.disableLeave as string, 10) === 1 ? 1 : 0;
		const isHidden = parseInt(data.hidden as string, 10) === 1;

		Groups.validateGroupName(data.name);

		const [exists, privGroupExists] = await Promise.all([
			meta.userOrGroupExists(data.name),
			privilegeGroupExists(data.name),
		]) as [boolean, boolean];
		if (exists || privGroupExists) {
			throw new Error('[[error:group-already-exists]]');
		}

		const memberCount = data.hasOwnProperty('ownerUid') ? 1 : 0;
		const isPrivate = data.hasOwnProperty('private') && data.private !== undefined ? parseInt(data.private as string, 10) === 1 : true;
		let groupData = {
			name: data.name,
			slug: slugify(data.name) as string,
			createtime: timestamp,
			userTitle: data.userTitle || data.name,
			userTitleEnabled: parseInt(data.userTitleEnabled as string, 10) === 1 ? 1 : 0,
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

	Groups.validateGroupName = function (name: string): void {
		if (!name) {
			throw new Error('[[error:group-name-too-short]]');
		}

		if (typeof name !== 'string') {
			throw new Error('[[error:invalid-group-name]]');
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		if (!Groups.isPrivilegeGroup(name) && name.length > meta.config.maximumGroupNameLength) {
			throw new Error('[[error:group-name-too-long]]');
		}

		if (name === 'guests' || (!Groups.isPrivilegeGroup(name) && name.includes(':'))) {
			throw new Error('[[error:invalid-group-name]]');
		}

		if (name.includes('/') || !slugify(name)) {
			throw new Error('[[error:invalid-group-name]]');
		}
	};
}

export = createGroup

