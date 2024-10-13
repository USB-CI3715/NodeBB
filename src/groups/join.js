'use strict';

const __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
	if (k2 === undefined) k2 = k;
	let desc = Object.getOwnPropertyDescriptor(m, k);
	if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
		desc = { enumerable: true, get: function () { return m[k]; } };
	}
	Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
	if (k2 === undefined) k2 = k;
	o[k2] = m[k];
}));
const __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
	Object.defineProperty(o, 'default', { enumerable: true, value: v });
}) : function (o, v) {
	o.default = v;
});
const __importStar = (this && this.__importStar) || function (mod) {
	if (mod && mod.__esModule) return mod;
	const result = {};
	if (mod != null) {
		Object.keys(mod).forEach((k) => {
			if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k)) {
				__createBinding(result, mod, k);
			}
		});
	}
	__setModuleDefault(result, mod);
	return result;
};
const __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	function adopt(value) { return value instanceof P ? value : new P((resolve) => { resolve(value); }); }
	const res = new (P || (P = Promise))((resolve, reject) => {
		function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
		function step(result) {
			if (result.done) {
				resolve(result.value);
			} else {
				adopt(result.value).then(fulfilled, rejected);
			}
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
	return res;
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = default_1;
const winston = __importStar(require('winston'));
const db = require('../database');
const user = require('../user');
const plugins = require('../plugins');
const cache = require('../cache');

function default_1(Groups) {
	Groups.join = function (groupNames, uid) {
		return __awaiter(this, undefined, undefined, function* () {
			if (!groupNames) {
				throw new Error('[[error:invalid-data]]');
			}
			if (Array.isArray(groupNames) && !groupNames.length) {
				return;
			}
			if (!Array.isArray(groupNames)) {
				groupNames = [groupNames];
			}
			if (!uid) {
				throw new Error('[[error:invalid-uid]]');
			}
			const [isMembers, exists, isAdmin] = yield Promise.all([
				Groups.isMemberOfGroups(uid, groupNames),
				Groups.exists(groupNames),
				user.isAdministrator(uid),
			]);
			const groupsToCreate = groupNames.filter((groupName, index) => groupName && !exists[index]);
			const groupsToJoin = groupNames.filter((groupName, index) => !isMembers[index]);
			if (!groupsToJoin.length) {
				return;
			}
			yield createNonExistingGroups(groupsToCreate);
			const promises = [
				db.sortedSetsAdd(groupsToJoin.map(groupName => `group:${groupName}:members`), Date.now(), uid),
				db.incrObjectField(groupsToJoin.map(groupName => `group:${groupName}`), 'memberCount'),
			];
			if (isAdmin) {
				promises.push(db.setsAdd(groupsToJoin.map(groupName => `group:${groupName}:owners`), uid));
			}
			yield Promise.all(promises);
			Groups.clearCache(uid, groupsToJoin);
			cache.del(groupsToJoin.map(name => `group:${name}:members`));
			const groupData = yield Groups.getGroupsFields(groupsToJoin, ['name', 'hidden', 'memberCount']);
			const visibleGroups = groupData.filter(groupData => groupData && !groupData.hidden);
			if (visibleGroups.length) {
				yield db.sortedSetAdd('groups:visible:memberCount', visibleGroups.map(groupData => groupData.memberCount), visibleGroups.map(groupData => groupData.name));
			}
			yield setGroupTitleIfNotSet(groupsToJoin, uid);
			plugins.hooks.fire('action:group.join', {
				groupNames: groupsToJoin,
				uid: uid,
			});
		});
	};
	function createNonExistingGroups(groupsToCreate) {
		return __awaiter(this, undefined, undefined, function* () {
			if (!groupsToCreate.length) {
				return;
			}
			for (const groupName of groupsToCreate) {
				try {
					// eslint-disable-next-line no-await-in-loop
					yield Groups.create({
						name: groupName,
						hidden: 1,
					});
				} catch (err) {
					if (err && err.message !== '[[error:group-already-exists]]') {
						winston.error(`[groups.join] Could not create new hidden group (${groupName})\n${err.stack}`);
						throw err;
					}
				}
			}
		});
	}
	function setGroupTitleIfNotSet(groupNames, uid) {
		return __awaiter(this, undefined, undefined, function* () {
			const ignore = ['registered-users', 'verified-users', 'unverified-users', Groups.BANNED_USERS];
			groupNames = groupNames.filter(groupName => !ignore.includes(groupName) && !Groups.isPrivilegeGroup(groupName));
			if (!groupNames.length) {
				return;
			}
			const currentTitle = yield db.getObjectField(`user:${uid}`, 'groupTitle');
			if (currentTitle || currentTitle === '') {
				return;
			}
			yield user.setUserField(uid, 'groupTitle', JSON.stringify(groupNames));
		});
	}
}
