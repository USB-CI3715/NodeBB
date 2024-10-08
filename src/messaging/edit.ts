'use strict';

import * as meta from '../meta';
import * as user from '../user';
import * as plugins from '../plugins';
import * as privileges from '../privileges';
import * as sockets from '../socket.io';

interface Payload {
	content: string;
	edited: number;
}

interface MessageData {
	fromuid: number;
	timestamp: number;
	system: boolean;
}

interface MessagingInterface {
	editMessage: (uid: number, mid: number, roomId: number, content: string) => Promise<void>;
	getMessageField: (mid: number, field: string) => Promise<string>;
	setMessageFields: (mid: number, payload: Payload) => Promise<void>;
	checkContent: (content: string) => Promise<void>;
	getMessagesData: (mids: number[], uid: number, roomId: number, includeDeleted: boolean) => Promise<any[]>;
	messageExists: (messageId: number) => Promise<boolean>;
	getMessageFields: (messageId: number, fields: string[]) => Promise<MessageData>;
	isUserInRoom: (uid: number, roomId: number) => Promise<boolean>;
	isRoomOwner: (uid: number, roomId: number) => Promise<boolean>;
	canEdit: (messageId: number, uid: number) => Promise<void>;
	canDelete: (messageId: number, uid: number) => Promise<void>;
	canPin: (roomId: number, uid: number) => Promise<void>;
}

module.exports = function (Messaging: MessagingInterface) {
	Messaging.editMessage = async (uid: number, mid: number, roomId: number, content: string): Promise<void> => {
		await Messaging.checkContent(content);
		const raw = await Messaging.getMessageField(mid, 'content');
		if (raw === content) {
			return;
		}

		const payload: Payload = await plugins.hooks.fire('filter:messaging.edit', {content: content, edited: Date.now(),});

		if (!String(payload.content).trim()) {
			throw new Error('[[error:invalid-chat-message]]');
		}
		await Messaging.setMessageFields(mid, payload);

		// Propagar este cambio a los usuarios en la sala
		const messages = await Messaging.getMessagesData([mid], uid, roomId, true);
		if (messages[0]) {
			const roomName = messages[0].deleted ? `uid_${uid}` : `chat_room_${roomId}`;
			sockets.in(roomName).emit('event:chats.edit', {messages: messages,});
		}

		plugins.hooks.fire('action:messaging.edit', {
			message: { ...messages[0], content: payload.content },
		});
	};

	const canEditDelete = async (messageId: number, uid: number, type: 'edit' | 'delete'): Promise<void> => {
		let durationConfig = '';
		if (type === 'edit') {
			durationConfig = 'chatEditDuration';
		} else if (type === 'delete') {
			durationConfig = 'chatDeleteDuration';
		}

		const exists = await Messaging.messageExists(messageId);
		if (!exists) {
			throw new Error('[[error:invalid-mid]]');
		}

		const isAdminOrGlobalMod = await user.isAdminOrGlobalMod(uid);

		if (meta.config.disableChat) {
			throw new Error('[[error:chat-disabled]]');
		} else if (!isAdminOrGlobalMod && meta.config.disableChatMessageEditing) {
			throw new Error('[[error:chat-message-editing-disabled]]');
		}

		const userData = await user.getUserFields(uid, ['banned']);
		if (userData.banned) {
			throw new Error('[[error:user-banned]]');
		}

		const canChat = await privileges.global.can(
			['chat', 'chat:privileged'],
			uid
		);
		if (!canChat.includes(true)) {
			throw new Error('[[error:no-privileges]]');
		}

		const messageData = await Messaging.getMessageFields(messageId, ['fromuid', 'timestamp', 'system',]);
		if (isAdminOrGlobalMod && !messageData.system) {
			return;
		}

		const chatConfigDuration = meta.config[durationConfig];
		if (chatConfigDuration && Date.now() - messageData.timestamp > chatConfigDuration * 1000) {
			throw new Error(`[[error:chat-${type}-duration-expired, ${meta.config[durationConfig]}]]`);
		}

		if (messageData.fromuid === parseInt(uid.toString(), 10) && !messageData.system) {
			return;
		}

		throw new Error(`[[error:cant-${type}-chat-message]]`);
	};

	Messaging.canEdit = async (messageId: number, uid: number): Promise<void> => await canEditDelete(messageId, uid, 'edit');
	Messaging.canDelete = async (messageId: number, uid: number): Promise<void> => await canEditDelete(messageId, uid, 'delete');

	Messaging.canPin = async (roomId: number, uid: number): Promise<void> => {
		const [isAdmin, isGlobalMod, inRoom, isRoomOwner] = await Promise.all([
			user.isAdministrator(uid),
			user.isGlobalModerator(uid),
			Messaging.isUserInRoom(uid, roomId),
			Messaging.isRoomOwner(uid, roomId),
		]);
		if (!isAdmin && !isGlobalMod && (!inRoom || !isRoomOwner)) {
			throw new Error('[[error:no-privileges]]');
		}
	};
};
