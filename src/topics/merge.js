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
const plugins = require('../plugins');
const posts = require('../posts');

function topicsModule(Topics) {
	const merge = function () {
		const args = [];
		for (let _i = 0; _i < arguments.length; _i++) {
			args[_i] = arguments[_i];
		}
		return __awaiter(this, void 0, void 0, function () {
			let tids; let uid; let _a; let options; let topicsData; let oldestTid; let mergeIntoTid; let otherTids; let _b; let otherTids_1; let tid; let pids; let _c; let pids_1; let
				pid;
			return __generator(this, function (_d) {
				switch (_d.label) {
					case 0:
						tids = args[0], uid = args[1], _a = args[2], options = _a === void 0 ? {} : _a;
						return [4 /* yield */, this.getTopicsFields(tids, ['scheduled'])];
					case 1:
						topicsData = _d.sent();
						if (topicsData.some(t => t.scheduled)) {
							throw new Error('[[error:cant-merge-scheduled]]');
						}
						oldestTid = findOldestTopic(tids);
						mergeIntoTid = oldestTid;
						if (!options.mainTid) return [3 /* break */, 2];
						mergeIntoTid = options.mainTid;
						return [3 /* break */, 4];
					case 2:
						if (!options.newTopicTitle) return [3 /* break */, 4];
						return [4 /* yield */, createNewTopic.call(this, options.newTopicTitle, oldestTid)];
					case 3:
						mergeIntoTid = _d.sent();
						_d.label = 4;
					case 4:
						otherTids = tids.sort((a, b) => a - b)
							.filter(tid => tid && parseInt(tid.toString(), 10) !== parseInt(mergeIntoTid.toString(), 10));
						_b = 0, otherTids_1 = otherTids;
						_d.label = 5;
					case 5:
						if (!(_b < otherTids_1.length)) return [3 /* break */, 15];
						tid = otherTids_1[_b];
						return [4 /* yield */, this.getPids(tid)];
					case 6:
						pids = _d.sent();
						_c = 0, pids_1 = pids;
						_d.label = 7;
					case 7:
						if (!(_c < pids_1.length)) return [3 /* break */, 10];
						pid = pids_1[_c];
						return [4 /* yield */, this.movePostToTopic(uid, pid, mergeIntoTid)];
					case 8:
						_d.sent();
						_d.label = 9;
					case 9:
						_c++;
						return [3 /* break */, 7];
					case 10: return [4 /* yield */, this.setTopicField(tid, 'mainPid', 0)];
					case 11:
						_d.sent();
						return [4 /* yield */, this.delete(tid, uid)];
					case 12:
						_d.sent();
						return [4 /* yield */, this.setTopicFields(tid, {
							mergeIntoTid: mergeIntoTid,
							mergerUid: uid,
							mergedTimestamp: Date.now(),
						})];
					case 13:
						_d.sent();
						_d.label = 14;
					case 14:
						_b++;
						return [3 /* break */, 5];
					case 15: return [4 /* yield */, Promise.all([
						posts.updateQueuedPostsTopic(mergeIntoTid, otherTids),
						updateViewCount.call(this, mergeIntoTid, tids),
					])];
					case 16:
						_d.sent();
						return [4 /* yield */, fireHook('action:topic.merge', {
							uid: uid,
							tids: tids,
							mergeIntoTid: mergeIntoTid,
							otherTids: otherTids,
						})];
					case 17:
						_d.sent();
						return [2 /* return */, mergeIntoTid];
				}
			});
		});
	};
	function createNewTopic(title, oldestTid) {
		return __awaiter(this, void 0, void 0, function () {
			let topicData; let params; let
				result;
			return __generator(this, function (_a) {
				switch (_a.label) {
					case 0: return [4 /* yield */, this.getTopicFields(oldestTid, ['uid', 'cid'])];
					case 1:
						topicData = _a.sent();
						params = {
							uid: topicData.uid,
							cid: topicData.cid,
							title: title,
						};
						return [4 /* yield */, fireHook('filter:topic.mergeCreateNewTopic', {
							oldestTid: oldestTid,
							params: params,
						})];
					case 2:
						result = _a.sent();
						return [2 /* return */, this.create(result.params)];
				}
			});
		});
	}
	function updateViewCount(mergeIntoTid, tids) {
		return __awaiter(this, void 0, void 0, function () {
			let topicData; let
				totalViewCount;
			return __generator(this, function (_a) {
				switch (_a.label) {
					case 0: return [4 /* yield */, this.getTopicsFields(tids, ['viewcount'])];
					case 1:
						topicData = _a.sent();
						totalViewCount = topicData.reduce((count, topic) => count + parseInt(topic.viewcount.toString(), 10), 0);
						return [4 /* yield */, this.setTopicField(mergeIntoTid, 'viewcount', totalViewCount)];
					case 2:
						_a.sent();
						return [2 /* return */, totalViewCount];
				}
			});
		});
	}
	function findOldestTopic(tids) {
		return Math.min.apply(Math, tids);
	}
	function fireHook(hookName, hookData) {
		return __awaiter(this, void 0, void 0, function () {
			let err_1;
			return __generator(this, (_a) => {
				switch (_a.label) {
					case 0:
						_a.trys.push([0, 2, , 3]);
						return [4 /* yield */, plugins.hooks.fire(hookName, hookData)];
					case 1: return [2 /* return */, _a.sent()];
					case 2:
						err_1 = _a.sent();
						console.error('Error in '.concat(hookName, ' hook:'), err_1);
						return [2 /* return */, hookData];
					case 3: return [2];
				}
			});
		});
	}
	return { merge: merge };
}
module.exports = topicsModule;
