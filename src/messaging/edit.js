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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/* Seccion: IMPORTACIONES */
/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const meta = require('../meta');
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const user = require('../user');
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const plugins = require('../plugins');
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const privileges = require('../privileges');
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const sockets = require('../socket.io');
/* Seccion: FUNCIONES */
module.exports = function (Messaging) {
    Messaging.editMessage = (uid, mid, roomId, content) => __awaiter(this, void 0, void 0, function* () {
        yield Messaging.checkContent(content);
        const raw = yield Messaging.getMessageField(mid, 'content');
        if (raw === content)
            return;
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
        const payload = yield plugins.hooks.fire('filter:messaging.edit', { content: content, edited: Date.now() });
        if (!String(payload.content).trim())
            throw new Error('[[error:invalid-chat-message]]');
        yield Messaging.setMessageFields(mid, payload);
        // Propagate this change to users in the room
        const messages = yield Messaging.getMessagesData([mid], uid, roomId, true);
        if (messages[0]) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const roomName = messages[0].deleted ? `uid_${uid}` : `chat_room_${roomId}`;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            sockets.in(roomName).emit('event:chats.edit', { messages: messages });
        }
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
        yield plugins.hooks.fire('action:messaging.edit', { message: Object.assign(Object.assign({}, messages[0]), { content: payload.content }) });
    });
    const canEditDelete = (messageId, uid, type) => __awaiter(this, void 0, void 0, function* () {
        let durationConfig = '';
        if (type === 'edit') {
            durationConfig = 'chatEditDuration';
        }
        else if (type === 'delete') {
            durationConfig = 'chatDeleteDuration';
        }
        const exists = yield Messaging.messageExists(messageId);
        if (!exists)
            throw new Error('[[error:invalid-mid]]');
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
        const isAdminOrGlobalMod = yield user.isAdminOrGlobalMod(uid);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        if (meta.config.disableChat) {
            throw new Error('[[error:chat-disabled]]');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        }
        else if (!isAdminOrGlobalMod && meta.config.disableChatMessageEditing) {
            throw new Error('[[error:chat-message-editing-disabled]]');
        }
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
        const userData = yield user.getUserFields(uid, ['banned']);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        if (userData.banned)
            throw new Error('[[error:user-banned]]');
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
        const canChat = yield privileges.global.can(['chat', 'chat:privileged'], uid);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        if (!canChat.includes(true))
            throw new Error('[[error:no-privileges]]');
        const messageData = yield Messaging.getMessageFields(messageId, ['fromuid', 'timestamp', 'system']);
        if (isAdminOrGlobalMod && !messageData.system)
            return;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const chatConfigDuration = meta.config[durationConfig];
        if (chatConfigDuration && Date.now() - messageData.timestamp > chatConfigDuration * 1000) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            throw new Error(`[[error:chat-${type}-duration-expired, ${chatConfigDuration}]]`);
        }
        if (messageData.fromuid === parseInt(uid.toString(), 10) && !messageData.system)
            return;
        throw new Error(`[[error:cant-${type}-chat-message]]`);
    });
    Messaging.canEdit = (messageId, uid) => __awaiter(this, void 0, void 0, function* () { return yield canEditDelete(messageId, uid, 'edit'); });
    Messaging.canDelete = (messageId, uid) => __awaiter(this, void 0, void 0, function* () { return yield canEditDelete(messageId, uid, 'delete'); });
    Messaging.canPin = (roomId, uid) => __awaiter(this, void 0, void 0, function* () {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const [isAdmin, isGlobalMod, inRoom, isRoomOwner] = yield Promise.all([
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            user.isAdministrator(uid), user.isGlobalModerator(uid),
            Messaging.isUserInRoom(uid, roomId), Messaging.isRoomOwner(uid, roomId),
        ]);
        if (!isAdmin && !isGlobalMod && (!inRoom || !isRoomOwner))
            throw new Error('[[error:no-privileges]]');
    });
};
