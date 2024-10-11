/*
	*******************************************************************************
	************************  Universidad Simon Bolivar  **************************
	*********  Departamento de Computacion y Tecnologia de la Informacion  ********
	*                                                                             *
	* - Trimestre: Septiembre-Diciembre 2024                                      *
	* - Materia: Ingenieria de Software 1                                         *
	* - Profesor: Eduardo Feo Flushing                                            *
	*                                                                             *
	* - Author: Junior Lara (17-10303)                                            *
	*                                                                             *
	* Proyecto 1B: Traducción a TypeScript o Incremento de Cobertura de Código    *
	*                                                                             *
	*******************************************************************************
*/

/* Seccion: IMPORTACIONES */
/* eslint-disable import/no-import-module-exports */
import * as meta from '../meta';
import * as user from '../user';
import * as plugins from '../plugins';
import * as privileges from '../privileges';
import * as sockets from '../socket.io';

/* Seccion: INTERFACES */
interface Payload {
	content : string;
	edited : number;
}

interface MessageData {
	fromuid : number;
	timestamp : number;
	system : boolean;
	deleted : boolean;
}

interface MessagingInterface {
	editMessage : (uid: number, mid: number, roomId: number, content: string) => Promise<void>;
	getMessageField : (mid: number, field: string) => Promise<string>;
	setMessageFields : (mid: number, payload: Payload) => Promise<void>;
	checkContent : (content: string) => Promise<void>;
	getMessagesData : (mids: number[], uid: number, roomId: number, includeDeleted: boolean) => Promise<MessageData[]>;
	messageExists : (messageId: number) => Promise<boolean>;
	getMessageFields : (messageId: number, fields: string[]) => Promise<MessageData>;
	isUserInRoom : (uid: number, roomId: number) => Promise<boolean>;
	isRoomOwner : (uid: number, roomId: number) => Promise<boolean>;
	canEdit : (messageId: number, uid: number) => Promise<void>;
	canDelete : (messageId: number, uid: number) => Promise<void>;
	canPin : (roomId: number, uid: number) => Promise<void>;
}

/* Seccion: FUNCIONES */
module.exports = function (Messaging: MessagingInterface) {
	Messaging.editMessage = async (uid: number, mid: number, roomId: number, content: string): Promise<void> => {
		await Messaging.checkContent(content);
		const raw = await Messaging.getMessageField(mid, 'content');
		if (raw === content) return;

		// eslint-disable-next-line max-len
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		const payload: Payload = await plugins.hooks.fire('filter:messaging.edit', { content: content, edited: Date.now() });

		if (!String(payload.content).trim()) throw new Error('[[error:invalid-chat-message]]');

		await Messaging.setMessageFields(mid, payload);

		const messages = await Messaging.getMessagesData([mid], uid, roomId, true);
		if (messages[0]) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			const roomName = messages[0].deleted ? `uid_${uid}` : `chat_room_${roomId}`;
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			sockets.in(roomName).emit('event:chats.edit', { messages: messages });
		}

		// eslint-disable-next-line max-len
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		await plugins.hooks.fire('action:messaging.edit', { message: { ...messages[0], content: payload.content } });
	};

	const canEditDelete = async (messageId: number, uid: number, type: 'edit' | 'delete'): Promise<void> => {
		let durationConfig = '';
		if (type === 'edit') {
			durationConfig = 'chatEditDuration';
		} else if (type === 'delete') {
			durationConfig = 'chatDeleteDuration';
		}

		const exists = await Messaging.messageExists(messageId);
		if (!exists) throw new Error('[[error:invalid-mid]]');

		// eslint-disable-next-line max-len
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		const isAdminOrGlobalMod = await user.isAdminOrGlobalMod(uid);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		if (meta.config.disableChat) {
			throw new Error('[[error:chat-disabled]]');
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		} else if (!isAdminOrGlobalMod && meta.config.disableChatMessageEditing) {
			throw new Error('[[error:chat-message-editing-disabled]]');
		}

		// eslint-disable-next-line max-len
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		const userData = await user.getUserFields(uid, ['banned']);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		if (userData.banned) throw new Error('[[error:user-banned]]');

		// eslint-disable-next-line max-len
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		const canChat = await privileges.global.can(['chat', 'chat:privileged'], uid);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		if (!canChat.includes(true)) throw new Error('[[error:no-privileges]]');

		const messageData = await Messaging.getMessageFields(messageId, ['fromuid', 'timestamp', 'system']);
		if (isAdminOrGlobalMod && !messageData.system) return;

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		const chatConfigDuration : number = meta.config[durationConfig];
		if (chatConfigDuration && Date.now() - messageData.timestamp > chatConfigDuration * 1000) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			throw new Error(`[[error:chat-${type}-duration-expired, ${chatConfigDuration}]]`);
		}

		if (messageData.fromuid === parseInt(uid.toString(), 10) && !messageData.system) return;
		throw new Error(`[[error:cant-${type}-chat-message]]`);
	};

	Messaging.canEdit = async (messageId: number, uid: number): Promise<void> => await canEditDelete(messageId, uid, 'edit');
	Messaging.canDelete = async (messageId: number, uid: number): Promise<void> => await canEditDelete(messageId, uid, 'delete');
	Messaging.canPin = async (roomId: number, uid: number): Promise<void> => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const [isAdmin, isGlobalMod, inRoom, isRoomOwner] = await Promise.all([
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			user.isAdministrator(uid), user.isGlobalModerator(uid),
			Messaging.isUserInRoom(uid, roomId), Messaging.isRoomOwner(uid, roomId),
		]);

		if (!isAdmin && !isGlobalMod && (!inRoom || !isRoomOwner)) throw new Error('[[error:no-privileges]]');
	};
};
