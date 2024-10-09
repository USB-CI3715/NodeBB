'use strict';

const __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	function adopt(value) { return value instanceof P ? value : new P((resolve) => { resolve(value); }); }
	return new (P || (P = Promise))((resolve, reject) => {
		function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
		function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
const __generator = (this && this.__generator) || function (thisArg, body) {
	let _ = { label: 0, sent: function () { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }; let f; let y; let t; let
		g = Object.create((typeof Iterator === 'function' ? Iterator : Object).prototype);
	return g.next = verb(0), g.throw = verb(1), g.return = verb(2), typeof Symbol === 'function' && (g[Symbol.iterator] = function () { return this; }), g;
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
const __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
	if (pack || arguments.length === 2) {
		for (var i = 0, l = from.length, ar; i < l; i++) {
			if (ar || !(i in from)) {
				if (!ar) ar = Array.prototype.slice.call(from, 0, i);
				ar[i] = from[i];
			}
		}
	}
	return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, '__esModule', { value: true });
const db = require('../database');
const io = require('../socket.io');

module.exports = function (Messaging) {
	const _this = this;
	Messaging.getUnreadCount = function (uid) {
		return __awaiter(_this, void 0, void 0, function () {
			return __generator(this, (_a) => {
				switch (_a.label) {
					case 0:
						if (!(parseInt(uid, 10) > 0)) {
							return [2 /* return */, 0];
						}
						return [4 /* yield */, db.sortedSetCard('uid:'.concat(uid, ':chat:rooms:unread'))];
					case 1: return [2 /* return */, _a.sent()];
				}
			});
		});
	};
	Messaging.pushUnreadCount = function (uids_1) {
		const args_1 = [];
		for (let _i = 1; _i < arguments.length; _i++) {
			args_1[_i - 1] = arguments[_i];
		}
		return __awaiter(_this, __spreadArray([uids_1], args_1, true), void 0, function (uids, data) {
			if (data === void 0) { data = null; }
			return __generator(this, (_a) => {
				if (!Array.isArray(uids)) {
					uids = [uids];
				}
				uids = uids.filter(uid => parseInt(uid, 10) > 0);
				if (!uids.length) {
					return [2];
				}
				uids.forEach((uid) => {
					io.in('uid_'.concat(uid)).emit('event:unread.updateChatCount', data);
				});
				return [2];
			});
		});
	};
	Messaging.markRead = function (uid, roomId) {
		return __awaiter(_this, void 0, void 0, function () {
			return __generator(this, (_a) => {
				switch (_a.label) {
					case 0: return [4 /* yield */, Promise.all([
						db.sortedSetRemove('uid:'.concat(uid, ':chat:rooms:unread'), roomId),
						db.setObjectField('uid:'.concat(uid, ':chat:rooms:read'), roomId, Date.now()),
					])];
					case 1:
						_a.sent();
						return [2];
				}
			});
		});
	};
	Messaging.hasRead = function (uids, roomId) {
		return __awaiter(_this, void 0, void 0, function () {
			let roomData; let _a; let userTimestamps_1; let mids; let lastMsgTimestamp_1; let
				isMembers;
			return __generator(this, (_b) => {
				switch (_b.label) {
					case 0:
						if (!uids.length) {
							return [2 /* return */, []];
						}
						return [4 /* yield */, Messaging.getRoomData(roomId)];
					case 1:
						roomData = _b.sent();
						if (!roomData) {
							return [2 /* return */, uids.map(() => false)];
						}
						if (!roomData.public) return [3 /* break */, 3];
						return [4 /* yield */, Promise.all([
							db.getObjectsFields(uids.map(uid => 'uid:'.concat(uid, ':chat:rooms:read')), [roomId]),
							db.getSortedSetRevRangeWithScores('chat:room:'.concat(roomId, ':mids'), 0, 0),
						])];
					case 2:
						_a = _b.sent(), userTimestamps_1 = _a[0], mids = _a[1];
						lastMsgTimestamp_1 = mids[0] ? mids[0].score : 0;
						return [2 /* return */, uids.map((uid, index) => !userTimestamps_1[index] ||
                            !userTimestamps_1[index][roomId] ||
                            parseInt(userTimestamps_1[index][roomId], 10) > lastMsgTimestamp_1)];
					case 3: return [4 /* yield */, db.isMemberOfSortedSets(uids.map(uid => 'uid:'.concat(uid, ':chat:rooms:unread')), roomId)];
					case 4:
						isMembers = _b.sent();
						return [2 /* return */, uids.map((uid, index) => !isMembers[index])];
				}
			});
		});
	};
	Messaging.markAllRead = function (uid) {
		return __awaiter(_this, void 0, void 0, function () {
			return __generator(this, (_a) => {
				switch (_a.label) {
					case 0: return [4 /* yield */, db.delete('uid:'.concat(uid, ':chat:rooms:unread'))];
					case 1:
						_a.sent();
						return [2];
				}
			});
		});
	};
	Messaging.markUnread = function (uids, roomId) {
		return __awaiter(_this, void 0, void 0, function () {
			let exists; let
				keys;
			return __generator(this, (_a) => {
				switch (_a.label) {
					case 0: return [4 /* yield */, Messaging.roomExists(roomId)];
					case 1:
						exists = _a.sent();
						if (!exists) {
							return [2];
						}
						keys = uids.map(uid => 'uid:'.concat(uid, ':chat:rooms:unread'));
						return [4 /* yield */, db.sortedSetsAdd(keys, Date.now(), roomId)];
					case 2:
						_a.sent();
						return [2];
				}
			});
		});
	};
};
