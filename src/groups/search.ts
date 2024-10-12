
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
import user from '../user';
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
import db from '../database';


interface Groups {
  slug: string;
  memberCount: number;
  hidden: boolean;
  createtime: number;
  search: (query: string, options: SearchOptions) => Promise<Groups[]>;
  ephemeralGroups: string[];
  BANNED_USERS: string;
  getGroupsAndMembers: (groupNames: string[]) => Promise<Groups[]>;
  getGroupsData: (groupNames: string[]) => Promise<Groups[]>;
  sort: (strategy: string, groups: Groups[]) => Groups[];
  searchMembers: (data: { query: string; groupName: string; uid?: number }) => Promise<SearchResults>;
  getOwnersAndMembers: (groupName: string, uid?: number, start?: number, stop?: number) => Promise<User[]>;
  ownership: {
	isOwners: (uids: number[], groupName: string) => Promise<boolean[]>;
  };
}

interface SearchOptions {
  hideEphemeralGroups?: boolean;
  showMembers?: boolean;
  filterHidden?: boolean;
  sort?: string;
}

interface SearchResults {
  users: User[];
  matchCount: number;
  timing: string;
}

interface User {
  uid: number;
  isOwner?: boolean;
}


function attachSearchFunctions(Groups: Groups) {
	Groups.search = async function (query: string, options: SearchOptions = {}): Promise<Groups[]> {
		if (!query) {
			return [];
		}
		query = query.toLowerCase();
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		let groupNames = Object.values(await db.getObject('groupslug:groupname') as Groups);
		if (!options.hideEphemeralGroups) {
			groupNames = Groups.ephemeralGroups.concat(groupNames as string[]);
		}
		groupNames = groupNames.filter(
			(name: string) => name.toLowerCase().includes(query) && name !== Groups.BANNED_USERS
		);
		groupNames = groupNames.slice(0, 100);

		let groupsData: Groups[] | undefined;
		if (options.showMembers) {
			groupsData = await Groups.getGroupsAndMembers(groupNames as string[]);
		} else {
			groupsData = await Groups.getGroupsData(groupNames as string[]);
		}
		groupsData = groupsData.filter(Boolean);
		if (options.filterHidden) {
			groupsData = groupsData.filter(group => !group.hidden);
		}
		return Groups.sort(options.sort, groupsData) || []; // Ensure non-empty array return
	};

	Groups.sort = function (strategy: string, groups: Groups[]): Groups[] {
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
	Groups.searchMembers = async function (data: {
    query: string;
    groupName: string;
    uid?: number;
  }): Promise<SearchResults> {
		if (!data.query) {
			const users = await Groups.getOwnersAndMembers(
				data.groupName,
				data.uid,
				0,
				19
			);
			const matchCount = users.length;
			const timing = '0.00';
			return { users, matchCount, timing };
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const results: SearchResults = await user.search({
			...data,
			paginate: false,
			hardCap: -1,
		}) as SearchResults;

		const uids = results.users.map(user => user?.uid);
		const isOwners = await Groups.ownership.isOwners(
			uids,
			data.groupName
		);

		results.users.forEach((user, index) => {
			if (user) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				user.isOwner = isOwners[index];
			}
		});

		results.users.sort((a, b) => {
			if (a?.isOwner && !b?.isOwner) {
				return -1;
			} else if (!a?.isOwner && b?.isOwner) {
				return 1;
			}
			return 0;
		});
		return results;
	};
}

export = attachSearchFunctions
