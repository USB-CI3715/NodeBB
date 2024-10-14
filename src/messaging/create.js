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
/* eslint-disable import/no-import-module-exports */
const lodash_1 = __importDefault(require("lodash"));
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const plugins_1 = __importDefault(require("../plugins"));
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const meta_1 = __importDefault(require("../meta"));
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const database_1 = __importDefault(require("../database"));
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const user_1 = __importDefault(require("../user"));
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const utils_1 = __importDefault(require("../utils"));
module.exports = function (Messaging) {
    Messaging.sendMessage = (data) => __awaiter(this, void 0, void 0, function* () {
        yield Messaging.checkContent(data.content);
        const inRoom = yield Messaging.isUserInRoom(data.uid, data.roomId);
        if (!inRoom) {
            throw new Error('[[error:not-allowed]]');
        }
        return yield Messaging.addMessage(data);
    });
    Messaging.checkContent = (content) => __awaiter(this, void 0, void 0, function* () {
        if (!content) {
            throw new Error('[[error:invalid-chat-message]]');
        }
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        const maximumChatMessageLength = meta_1.default.config.maximumChatMessageLength || 1000;
        content = String(content).trim();
        let { length } = content;
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        ({ content, length } = yield plugins_1.default.hooks.fire('filter:messaging.checkContent', { content, length }));
        if (!content) {
            throw new Error('[[error:invalid-chat-message]]');
        }
        if (length > maximumChatMessageLength) {
            throw new Error(`[[error:chat-message-too-long, ${maximumChatMessageLength}]]`);
        }
    });
    Messaging.addMessage = (data) => __awaiter(this, void 0, void 0, function* () {
        const { uid, roomId } = data;
        const roomData = yield Messaging.getRoomData(roomId);
        if (!roomData) {
            throw new Error('[[error:no-room]]');
        }
        if (data.toMid) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            if (!utils_1.default.isNumber(data.toMid)) {
                throw new Error('[[error:invalid-mid]]');
            }
            if (!(yield Messaging.canViewMessage(data.toMid, roomId, uid))) {
                throw new Error('[[error:no-privileges]]');
            }
        }
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        const mid = yield database_1.default.incrObjectField('global', 'nextMid');
        const timestamp = data.timestamp || Date.now();
        let message = {
            mid: mid,
            content: String(data.content),
            timestamp: timestamp,
            fromuid: uid,
            roomId: roomId,
        };
        if (data.toMid) {
            message.toMid = data.toMid;
        }
        if (data.system) {
            message.system = data.system;
        }
        if (data.ip) {
            message.ip = data.ip;
        }
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        message = yield plugins_1.default.hooks.fire('filter:messaging.save', message);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        yield database_1.default.setObject(`message:${mid}`, message);
        const isNewSet = yield Messaging.isNewSet(uid, roomId, timestamp);
        const tasks = [
            Messaging.addMessageToRoom(roomId, mid, timestamp),
            Messaging.markRead(uid, roomId),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            database_1.default.sortedSetAdd('messages:mid', timestamp, mid),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            database_1.default.incrObjectField('global', 'messageCount'),
        ];
        if (data.toMid) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            tasks.push(database_1.default.sortedSetAdd(`mid:${data.toMid}:replies`, timestamp, mid));
        }
        if (roomData.public) {
            tasks.push(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            database_1.default.sortedSetAdd('chat:rooms:public:lastpost', timestamp, roomId));
        }
        else {
            let uids = yield Messaging.getUidsInRoom(roomId, 0, -1);
            // eslint-disable-next-line max-len
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            uids = yield user_1.default.blocks.filterUids(uid, uids);
            tasks.push(Messaging.addRoomToUsers(roomId, uids, timestamp), Messaging.markUnread(uids.filter((uid) => uid !== data.uid), roomId));
        }
        yield Promise.all(tasks);
        const messages = yield Messaging.getMessagesData([mid], uid, roomId, true);
        if (!messages || !messages[0]) {
            return null;
        }
        messages[0].newSet = isNewSet;
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        yield plugins_1.default.hooks.fire('action:messaging.save', { message: message, data: data });
        return messages[0];
    });
    Messaging.addSystemMessage = (content, uid, roomId) => __awaiter(this, void 0, void 0, function* () {
        const message = yield Messaging.addMessage({
            content: content,
            uid: uid,
            roomId: roomId,
            system: 1,
        });
        Messaging.notifyUsersInRoom(uid, roomId, message);
    });
    Messaging.addRoomToUsers = (roomId, uids, timestamp) => __awaiter(this, void 0, void 0, function* () {
        if (!uids.length) {
            return;
        }
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        const keys = lodash_1.default.uniq(uids).map(uid => `uid:${uid}:chat:rooms`);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        yield database_1.default.sortedSetsAdd(keys, timestamp, roomId);
    });
    Messaging.addMessageToRoom = (roomId, mid, timestamp) => __awaiter(this, void 0, void 0, function* () {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        yield database_1.default.sortedSetAdd(`chat:room:${roomId}:mids`, timestamp, mid);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        yield database_1.default.incrObjectField(`chat:room:${roomId}`, 'messageCount');
    });
};
