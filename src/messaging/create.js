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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable import/no-import-module-exports */
const _ = __importStar(require("lodash"));
const plugins = __importStar(require("../meta"));
const meta = __importStar(require("../plugins"));
const db = __importStar(require("../database"));
const user = __importStar(require("../user"));
const utils = __importStar(require("../utils"));
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
        const maximumChatMessageLength = meta.config.maximumChatMessageLength || 1000;
        content = String(content).trim();
        let { length } = content;
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        ({ content, length } = yield plugins.hooks.fire('filter:messaging.checkContent', { content, length }));
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
            if (!utils.isNumber(data.toMid)) {
                throw new Error('[[error:invalid-mid]]');
            }
            if (!(yield Messaging.canViewMessage(data.toMid, roomId, uid))) {
                throw new Error('[[error:no-privileges]]');
            }
        }
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        const mid = yield db.incrObjectField('global', 'nextMid');
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
        message = yield plugins.hooks.fire('filter:messaging.save', message);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        yield db.setObject(`message:${mid}`, message);
        const isNewSet = yield Messaging.isNewSet(uid, roomId, timestamp);
        const tasks = [
            Messaging.addMessageToRoom(roomId, mid, timestamp),
            Messaging.markRead(uid, roomId),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            db.sortedSetAdd('messages:mid', timestamp, mid),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            db.incrObjectField('global', 'messageCount'),
        ];
        if (data.toMid) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            tasks.push(db.sortedSetAdd(`mid:${data.toMid}:replies`, timestamp, mid));
        }
        if (roomData.public) {
            tasks.push(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            db.sortedSetAdd('chat:rooms:public:lastpost', timestamp, roomId));
        }
        else {
            let uids = yield Messaging.getUidsInRoom(roomId, 0, -1);
            // eslint-disable-next-line max-len
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            uids = yield user.blocks.filterUids(uid, uids);
            tasks.push(Messaging.addRoomToUsers(roomId, uids, timestamp), Messaging.markUnread(uids.filter((uid) => uid !== data.uid), roomId));
        }
        yield Promise.all(tasks);
        const messages = yield Messaging.getMessagesData([mid], uid, roomId, true);
        if (!messages || !messages[0]) {
            return null;
        }
        messages[0].newSet = isNewSet;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        plugins.hooks.fire('action:messaging.save', { message: message, data: data });
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
        const keys = _.uniq(uids).map(uid => `uid:${uid}:chat:rooms`);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        yield db.sortedSetsAdd(keys, timestamp, roomId);
    });
    Messaging.addMessageToRoom = (roomId, mid, timestamp) => __awaiter(this, void 0, void 0, function* () {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        yield db.sortedSetAdd(`chat:room:${roomId}:mids`, timestamp, mid);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        yield db.incrObjectField(`chat:room:${roomId}`, 'messageCount');
    });
};
