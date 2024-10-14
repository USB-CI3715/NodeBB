'use strict';

const __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	function adopt(value) { return value instanceof P ? value : new P((resolve) => { resolve(value); }); }
	const res = new (P || (P = Promise))((resolve, reject) => {
		function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
		function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
	return res;
};
const __generator = (this && this.__generator) || function (thisArg, body) {
	let f; let y; let t; let g;
	let _ = { label: 0, sent: function () { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] };
	return g = { next: verb(0), throw: verb(1), return: verb(2) }, typeof Symbol === 'function' && (g[Symbol.iterator] = function () { return this; }), g;
	function verb(n) { return function (v) { return step([n, v]); }; }
	function step(op) {
		if (f) throw new TypeError('Generator is already executing.');
		while (g && (g = 0, op[0] && (_ = 0)), _) {
			try {
				if (f = 1, y && (t = op[0] & 2 ? y.return : op[0] ? y.throw || ((t = y.return) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
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
		}
		if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
	}
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = default_1;
/* eslint-disable import/no-import-module-exports */
const winston = require('winston');
/* eslint-disable import/no-import-module-exports */
const database_1 = require('../database');
/* eslint-disable import/no-import-module-exports */
const user_1 = require('../user');
/* eslint-disable import/no-import-module-exports */
const plugins_1 = require('../plugins');
/* eslint-disable import/no-import-module-exports */
const cache_1 = require('../cache');

function default_1(Groups) {
	Groups.join = function (groupNames, uid) {
		return __awaiter(this, void 0, void 0, function () {
			let _a; let isMembers; let exists; let isAdmin; let groupsToCreate; let groupsToJoin; let promises; let groupData; let
				visibleGroups;
			return __generator(this, (_b) => {
				switch (_b.label) {
					case 0:
						if (!groupNames) {
							throw new Error('[[error:invalid-data]]');
						}
						if (Array.isArray(groupNames) && !groupNames.length) {
							return [2];
						}
						if (!Array.isArray(groupNames)) {
							groupNames = [groupNames];
						}
						if (!uid) {
							throw new Error('[[error:invalid-uid]]');
						}
						return [4 /* yield */, Promise.all([
							Groups.isMemberOfGroups(uid, groupNames),
							Groups.exists(groupNames),
							user_1.default.isAdministrator(uid),
						])];
					case 1:
						_a = _b.sent(), isMembers = _a[0], exists = _a[1], isAdmin = _a[2];
						groupsToCreate = groupNames.filter((groupName, index) => groupName && !exists[index]);
						groupsToJoin = groupNames.filter((groupName, index) => !isMembers[index]);
						if (!groupsToJoin.length) {
							return [2];
						}
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
						return [4 /* yield */, createNonExistingGroups(groupsToCreate)];
					case 2:
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
						_b.sent();
						promises = [
							database_1.default.sortedSetsAdd(groupsToJoin.map(groupName => 'group:'.concat(groupName, ':members')), Date.now(), uid),
							database_1.default.incrObjectField(groupsToJoin.map(groupName => 'group:'.concat(groupName)), 'memberCount'),
						];
						if (isAdmin) {
							promises.push(database_1.default.setsAdd(groupsToJoin.map(groupName => 'group:'.concat(groupName, ':owners')), uid));
						}
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
						return [4 /* yield */, Promise.all(promises)];
					case 3:
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
						_b.sent();
						Groups.clearCache(uid, groupsToJoin);
						cache_1.default.del(groupsToJoin.map(name => 'group:'.concat(name, ':members')));
						return [4 /* yield */, Groups.getGroupsFields(groupsToJoin, ['name', 'hidden', 'memberCount'])];
					case 4:
						groupData = _b.sent();
						visibleGroups = groupData.filter(groupData => groupData && !groupData.hidden);
						if (!visibleGroups.length) return [3 /* break */, 6];
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
						return [4 /* yield */, database_1.default.sortedSetAdd('groups:visible:memberCount', visibleGroups.map(groupData => groupData.memberCount), visibleGroups.map(groupData => groupData.name))];
					case 5:
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
						_b.sent();
						_b.label = 6;
					case 6:
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
						return [4 /* yield */, setGroupTitleIfNotSet(groupsToJoin, uid)];
					case 7:
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
						_b.sent();
						plugins_1.default.hooks.fire('action:group.join', {
							groupNames: groupsToJoin,
							uid: uid,
						});
						return [2];
				}
			});
		});
	};
	function createNonExistingGroups(groupsToCreate) {
		return __awaiter(this, void 0, void 0, function () {
			let _i; let groupsToCreate_1; let groupName; let
				err_1;
			return __generator(this, (_a) => {
				switch (_a.label) {
					case 0:
						if (!groupsToCreate.length) {
							return [2];
						}
						_i = 0, groupsToCreate_1 = groupsToCreate;
						_a.label = 1;
					case 1:
						if (!(_i < groupsToCreate_1.length)) return [3 /* break */, 6];
						groupName = groupsToCreate_1[_i];
						_a.label = 2;
					case 2:
						_a.trys.push([2, 4, , 5]);
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
						// eslint-disable-next-line no-await-in-loop
						return [4 /* yield */, Groups.create({
							name: groupName,
							hidden: 1,
						})];
					case 3:
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
						// eslint-disable-next-line no-await-in-loop
						_a.sent();
						return [3 /* break */, 5];
					case 4:
						err_1 = _a.sent();
						if (err_1 && err_1.message !== '[[error:group-already-exists]]') {
							winston.error('[groups.join] Could not create new hidden group ('.concat(groupName, ')\n').concat(err_1.stack));
							throw err_1;
						}
						return [3 /* break */, 5];
					case 5:
						_i++;
						return [3 /* break */, 1];
					case 6: return [2];
				}
			});
		});
	}
	function setGroupTitleIfNotSet(groupNames, uid) {
		return __awaiter(this, void 0, void 0, function () {
			let ignore; let
				currentTitle;
			return __generator(this, (_a) => {
				switch (_a.label) {
					case 0:
						ignore = ['registered-users', 'verified-users', 'unverified-users', Groups.BANNED_USERS];
						groupNames = groupNames.filter(groupName => !ignore.includes(groupName) && !Groups.isPrivilegeGroup(groupName));
						if (!groupNames.length) {
							return [2];
						}
						return [4 /* yield */, database_1.default.getObjectField('user:'.concat(uid), 'groupTitle')];
					case 1:
						currentTitle = _a.sent();
						if (currentTitle || currentTitle === '') {
							return [2];
						}
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
						return [4 /* yield */, user_1.default.setUserField(uid, 'groupTitle', JSON.stringify(groupNames))];
					case 2:
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
						_a.sent();
						return [2];
				}
			});
		});
	}
}

