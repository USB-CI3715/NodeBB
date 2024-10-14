/* eslint-disable import/no-import-module-exports */
import * as _ from 'lodash';
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
import * as plugins from '../plugins';
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
import * as meta from '../meta';
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
import * as db from '../database';
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
import * as user from '../user';
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
import * as utils from '../utils';

interface Messaging {
    sendMessage(data: MessageData): Promise<MessageData>;
    checkContent(content: string);
    addMessage(data: MessageData): Promise<MessageData>;
    addSystemMessage(content: string, uid:string, roomId: number);
    addRoomToUsers(roomId: number, uids: string[], timestamp: number);
    addMessageToRoom(roomId: number, mid: number, timestamp: number);
	isUserInRoom(uid: string, roomId: number): Promise<boolean | boolean[]>;
	getRoomData(roomId: number): Promise<{ public: boolean }>;
	canViewMessage(toMid:number, roomId:number, uid:string): Promise<boolean | boolean[]> ;
	isNewSet(uid: string, roomId: number, timestamp: number): Promise<boolean>;
	markRead(uid: string, roomId: number): Promise<void>;
	getUidsInRoom(roomId: number, start: number, stop: number): Promise<string[]>;
	markUnread(uids: string[], roomId:number): Promise<void>;
	getMessagesData(mids:number[], uid:string, roomId:number, isNew:boolean): Promise<MessageData[]>;
	notifyUsersInRoom(uid:string, roomId:number, message: MessageData);

}

interface MessageData{
	toMid?: number;
	timestamp?: number;
	uid?: string;
	roomId?: number;
	content?: string;
	system?: number;
	ip?: string;
	newSet?: boolean;
	mid?: number;
	fromuid?: string;
}

module.exports = function (Messaging: Messaging) {
	Messaging.sendMessage = async (data: MessageData): Promise<MessageData> => {
		await Messaging.checkContent(data.content);

		const inRoom = await Messaging.isUserInRoom(data.uid, data.roomId);
		if (!inRoom) {
			throw new Error('[[error:not-allowed]]');
		}

		return await Messaging.addMessage(data);
	};

	Messaging.checkContent = async (content: string) => {
		if (!content) {
			throw new Error('[[error:invalid-chat-message]]');
		}
		// eslint-disable-next-line max-len
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
		const maximumChatMessageLength: number = meta.config.maximumChatMessageLength || 1000;
		content = String(content).trim();
		let { length } = content;
		// eslint-disable-next-line max-len
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
		({ content, length } = await plugins.hooks.fire('filter:messaging.checkContent', { content, length }));
		if (!content) {
			throw new Error('[[error:invalid-chat-message]]');
		}
		if (length > maximumChatMessageLength) {
			throw new Error(`[[error:chat-message-too-long, ${maximumChatMessageLength}]]`);
		}
	};

	Messaging.addMessage = async (data: MessageData): Promise<MessageData> => {
		const { uid, roomId } = data;
		const roomData = await Messaging.getRoomData(roomId);
		if (!roomData) {
			throw new Error('[[error:no-room]]');
		}
		if (data.toMid) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
			if (!utils.isNumber(data.toMid)) {
				throw new Error('[[error:invalid-mid]]');
			}
			if (!await Messaging.canViewMessage(data.toMid, roomId, uid)) {
				throw new Error('[[error:no-privileges]]');
			}
		}
		// eslint-disable-next-line max-len
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
		const mid: number = await db.incrObjectField('global', 'nextMid');
		const timestamp = data.timestamp || Date.now();
		let message: MessageData = {
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
		message = await plugins.hooks.fire('filter:messaging.save', message);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		await db.setObject(`message:${mid}`, message);
		const isNewSet = await Messaging.isNewSet(uid, roomId, timestamp);

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
				db.sortedSetAdd('chat:rooms:public:lastpost', timestamp, roomId)
			);
		} else {
			let uids = await Messaging.getUidsInRoom(roomId, 0, -1);
			// eslint-disable-next-line max-len
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
			uids = await user.blocks.filterUids(uid, uids);
			tasks.push(
				Messaging.addRoomToUsers(roomId, uids, timestamp),
				Messaging.markUnread(uids.filter((uid: string) => uid !== data.uid), roomId), // Revisar en el futuro
			);
		}
		await Promise.all(tasks);

		const messages = await Messaging.getMessagesData([mid], uid, roomId, true);
		if (!messages || !messages[0]) {
			return null;
		}

		messages[0].newSet = isNewSet;
		// eslint-disable-next-line max-len
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
		await plugins.hooks.fire('action:messaging.save', { message: message, data: data });
		return messages[0];
	};

	Messaging.addSystemMessage = async (content: string, uid:string, roomId: number) => {
		const message = await Messaging.addMessage({
			content: content,
			uid: uid,
			roomId: roomId,
			system: 1,
		});
		Messaging.notifyUsersInRoom(uid, roomId, message);
	};

	Messaging.addRoomToUsers = async (roomId: number, uids: string[], timestamp: number) => {
		if (!uids.length) {
			return;
		}
		// eslint-disable-next-line max-len
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
		const keys = _.uniq(uids).map(uid => `uid:${uid}:chat:rooms`);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		await db.sortedSetsAdd(keys, timestamp, roomId);
	};

	Messaging.addMessageToRoom = async (roomId: number, mid: number, timestamp: number) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		await db.sortedSetAdd(`chat:room:${roomId}:mids`, timestamp, mid);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		await db.incrObjectField(`chat:room:${roomId}`, 'messageCount');
	};
};
