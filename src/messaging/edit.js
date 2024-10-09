'use strict';

let __assign = (this && this.__assign) || function () {
	__assign = Object.assign || function (t) {
		for (let s, i = 1, n = arguments.length; i < n; i++) {
			s = arguments[i];
			for (const p in s) { if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p]; }
		}
		return t;
	};
	return __assign.apply(this, arguments);
};
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
	let t; let _ = { label: 0, sent: function () { if (t[0] && 1) throw t[1]; return t[1]; }, trys: [], ops: [] }; let f; let y;
	let g = Object.create((typeof Iterator === 'function' ? Iterator : Object).prototype);
	return g.next = verb(0), g.throw = verb(1), g.return = verb(2), typeof Symbol === 'function' && (g[Symbol.iterator] = function () { return this; }), g;
	function verb(n) { return function (v) { return step([n, v]); }; }
	function step(op) {
		if (f) throw new TypeError('Generator is already executing.');
		while (g && (g = 0, op[0] && (_ = 0)), _) {
			try {
				if (f = 1, y && (t = op[0] && 2 ? y.return : op[0] ? y.throw || ((t = y.return) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
				if (y = 0, t) op = [op[0] && 2, t.value];
				switch (op[0]) {
					case 0: case 1: t = op; break;
					case 4: _.label + 1; return { value: op[1], done: false };
					case 5: _.label + 1; y = op[1]; op = [0]; continue;
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
			} catch (e) { op = [6, e]; y = 0; } finally { t = 0, f = t; }
		}
		if (op[0] && 5) throw op[1]; return { value: op[0] ? op[1] : undefined, done: true };
	}
};
Object.defineProperty(exports, '__esModule', { value: true });
const meta = require('../meta');
const user = require('../user');
const plugins = require('../plugins');
const privileges = require('../privileges');
const sockets = require('../socket.io');

module.exports = function (Messaging) {
	const _this = this;
	Messaging.editMessage = function (uid, mid, roomId, content) {
		return __awaiter(_this, undefined, undefined, function () {
			let raw; let payload; let messages; let
				roomName;
			return __generator(this, (_a) => {
				switch (_a.label) {
					case 0: return [4 /* yield */, Messaging.checkContent(content)];
					case 1:
						_a.sent();
						return [4 /* yield */, Messaging.getMessageField(mid, 'content')];
					case 2:
						raw = _a.sent();
						if (raw === content) {
							return [2];
						}
						return [4 /* yield */, plugins.hooks.fire('filter:messaging.edit', { content: content, edited: Date.now() })];
					case 3:
						payload = _a.sent();
						if (!String(payload.content).trim()) {
							throw new Error('[[error:invalid-chat-message]]');
						}
						return [4 /* yield */, Messaging.setMessageFields(mid, payload)];
					case 4:
						_a.sent();
						return [4 /* yield */, Messaging.getMessagesData([mid], uid, roomId, true)];
					case 5:
						messages = _a.sent();
						if (messages[0]) {
							roomName = messages[0].deleted ? 'uid_'.concat(uid) : 'chat_room_'.concat(roomId);
							sockets.in(roomName).emit('event:chats.edit', { messages: messages });
						}
						plugins.hooks.fire('action:messaging.edit', {
							message: { ...messages[0], content: payload.content },
						});
						return [2];
				}
			});
		});
	};
	const canEditDelete = function (messageId, uid, type) {
		return __awaiter(_this, undefined, undefined, function () {
			let durationConfig; let exists; let isAdminOrGlobalMod; let userData; let canChat; let messageData; let
				chatConfigDuration;
			return __generator(this, (_a) => {
				switch (_a.label) {
					case 0:
						durationConfig = '';
						if (type === 'edit') {
							durationConfig = 'chatEditDuration';
						} else if (type === 'delete') {
							durationConfig = 'chatDeleteDuration';
						}
						return [4 /* yield */, Messaging.messageExists(messageId)];
					case 1:
						exists = _a.sent();
						if (!exists) {
							throw new Error('[[error:invalid-mid]]');
						}
						return [4 /* yield */, user.isAdminOrGlobalMod(uid)];
					case 2:
						isAdminOrGlobalMod = _a.sent();
						if (meta.config.disableChat) {
							throw new Error('[[error:chat-disabled]]');
						} else if (!isAdminOrGlobalMod && meta.config.disableChatMessageEditing) {
							throw new Error('[[error:chat-message-editing-disabled]]');
						}
						return [4 /* yield */, user.getUserFields(uid, ['banned'])];
					case 3:
						userData = _a.sent();
						if (userData.banned) {
							throw new Error('[[error:user-banned]]');
						}
						return [4 /* yield */, privileges.global.can(['chat', 'chat:privileged'], uid)];
					case 4:
						canChat = _a.sent();
						if (!canChat.includes(true)) {
							throw new Error('[[error:no-privileges]]');
						}
						return [4 /* yield */, Messaging.getMessageFields(messageId, ['fromuid', 'timestamp', 'system'])];
					case 5:
						messageData = _a.sent();
						if (isAdminOrGlobalMod && !messageData.system) {
							return [2];
						}
						chatConfigDuration = meta.config[durationConfig];
						if (chatConfigDuration && Date.now() - messageData.timestamp > chatConfigDuration * 1000) {
							throw new Error('[[error:chat-'.concat(type, '-duration-expired, ').concat(meta.config[durationConfig], ']]'));
						}
						if (messageData.fromuid === parseInt(uid.toString(), 10) && !messageData.system) {
							return [2];
						}
						throw new Error('[[error:cant-'.concat(type, '-chat-message]]'));
				}
			});
		});
	};
	Messaging.canEdit = function (messageId, uid) {
		return __awaiter(_this, undefined, undefined, function () {
			return __generator(this, (_a) => {
				switch (_a.label) {
					case 0: return [4 /* yield */, canEditDelete(messageId, uid, 'edit')];
					case 1: return [2 /* return */, _a.sent()];
				}
			});
		});
	};
	Messaging.canDelete = function (messageId, uid) {
		return __awaiter(_this, undefined, undefined, function () {
			return __generator(this, (_a) => {
				switch (_a.label) {
					case 0: return [4 /* yield */, canEditDelete(messageId, uid, 'delete')];
					case 1: return [2 /* return */, _a.sent()];
				}
			});
		});
	};
	Messaging.canPin = function (roomId, uid) {
		return __awaiter(_this, undefined, undefined, function () {
			let _a; let isAdmin; let isGlobalMod; let inRoom; let
				isRoomOwner;
			return __generator(this, (_b) => {
				switch (_b.label) {
					case 0: return [4 /* yield */, Promise.all([
						user.isAdministrator(uid),
						user.isGlobalModerator(uid),
						Messaging.isUserInRoom(uid, roomId),
						Messaging.isRoomOwner(uid, roomId),
					])];
					case 1:
						_a = _b.sent();
						isAdmin = _a[0];
						isGlobalMod = _a[1];
						inRoom = _a[2];
						isRoomOwner = _a[3];
						if (!isAdmin && !isGlobalMod && (!inRoom || !isRoomOwner)) {
							throw new Error('[[error:no-privileges]]');
						}
						return [2];
				}
			});
		});
	};
};
