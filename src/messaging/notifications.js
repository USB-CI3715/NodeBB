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
		g;
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
const winston = require('winston'); // Importa la biblioteca 'winston' para el manejo de logs y errores
const batch_1 = require('../batch'); // Importa utilidades para procesamiento por lotes
const database_1 = require('../database'); // Importa funciones para interactuar con la base de datos
const notifications_1 = require('../notifications'); // Importa funcionalidades para manejar notificaciones
const user_1 = require('../user'); // Importa funcionalidades relacionadas con usuarios
const socket_io_1 = require('../socket.io'); // Importa la funcionalidad de WebSockets (para comunicación en tiempo real)
const plugins_1 = require('../plugins');
// Importa funcionalidades de extensiones y plugins
function default_1(Messaging) {
	const _this = this;
	// Establece la configuración de notificaciones de un usuario en una sala
	Messaging.setUserNotificationSetting = function (uid, roomId, value) {
		return __awaiter(_this, void 0, void 0, function () {
			return __generator(this, (_a) => {
				switch (_a.label) {
					case 0:
						if (!(value === -1)) return [3 /* break */, 2];
						// Si el valor es -1, restablecer la configuración a los valores predeterminados
						return [4 /* yield */, database_1.default.deleteObjectField('chat:room:'.concat(roomId, ':notification:settings'), uid)];
					case 1:
					// Si el valor es -1, restablecer la configuración a los valores predeterminados
						_a.sent();
						return [3 /* break */, 4];
					case 2:
					// Establece el valor personalizado para el usuario en la sala
						return [4 /* yield */, database_1.default.setObjectField('chat:room:'.concat(roomId, ':notification:settings'), uid, value)];
					case 3:
					// Establece el valor personalizado para el usuario en la sala
						_a.sent();
						_a.label = 4;
					case 4: return [2];
				}
			});
		});
	};
	// Obtiene las configuraciones de notificación de un grupo de usuarios en una sala
	Messaging.getUidsNotificationSetting = function (uids, roomId) {
		return __awaiter(_this, void 0, void 0, function () {
			let _a; let settings; let
				roomData;
			return __generator(this, (_b) => {
				switch (_b.label) {
					case 0: return [4 /* yield */, Promise.all([
					// Obtiene los ajustes personalizados de cada usuario
						database_1.default.getObjectFields('chat:room:'.concat(roomId, ':notification:settings'), uids),
						// Obtiene la configuración de notificaciones predeterminada de la sala
						Messaging.getRoomData(roomId, ['notificationSetting']),
					])];
					case 1:
						_a = _b.sent(), settings = _a[0], roomData = _a[1];
						// Combina los ajustes personalizados con la configuración predeterminada
						return [2 /* return */, uids.map(uid => parseInt(settings[uid] || roomData.notificationSetting.toString(), 10))];
				}
			});
		});
	};
	// Marca las notificaciones de una sala como leídas para un usuario específico
	Messaging.markRoomNotificationsRead = function (uid, roomId) {
		return __awaiter(_this, void 0, void 0, function () {
			let chatNids;
			return __generator(this, (_a) => {
				switch (_a.label) {
					case 0: return [4 /* yield */, database_1.default.getSortedSetScan({
						key: 'uid:'.concat(uid, ':notifications:unread'), // Clave donde se almacenan las notificaciones no leídas del usuario
						match: 'chat_'.concat(roomId, '_*'), // Busca notificaciones relacionadas con la sala especificada
					})];
					case 1:
						chatNids = _a.sent();
						if (!chatNids.length) return [3 /* break */, 4];
						// Marca las notificaciones como leídas
						return [4 /* yield */, notifications_1.default.markReadMultiple(chatNids, uid)];
					case 2:
					// Marca las notificaciones como leídas
						_a.sent();
						// Actualiza el recuento de notificaciones para el usuario
						return [4 /* yield */, user_1.default.notifications.pushCount(uid)];
					case 3:
					// Actualiza el recuento de notificaciones para el usuario
						_a.sent();
						_a.label = 4;
					case 4: return [2];
				}
			});
		});
	};
	// Notifica a los usuarios de una sala sobre un nuevo mensaje
	Messaging.notifyUsersInRoom = function (fromUid, roomId, messageObj) {
		return __awaiter(_this, void 0, void 0, function () {
			let isPublic; let _a; let data; let unreadData; let uids; let
				err_1;
			return __generator(this, (_b) => {
				switch (_b.label) {
					case 0:
						_a = parseInt;
						return [4 /* yield */, database_1.default.getObjectField('chat:room:'.concat(roomId), 'public')];
					case 1:
						isPublic = _a.apply(void 0, [_b.sent(), 10]) === 1;
						data = {
							roomId: roomId,
							fromUid: fromUid,
							message: messageObj,
							public: isPublic,
						};
						return [4 /* yield */, plugins_1.default.hooks.fire('filter:messaging.notify', data)];
					case 2:
					// Permite a los plugins modificar los datos de la notificación
						data = _b.sent();
						if (!data) {
						// Si los datos fueron anulados por un plugin, no continuar
							return [2];
						}
						// Envía el mensaje a todos los usuarios conectados a la sala
						socket_io_1.default.in('chat_room_'.concat(roomId)).emit('event:chats.receive', data);
						unreadData = { roomId: roomId, fromUid: fromUid, public: isPublic };
						if (isPublic && !messageObj.system) {
						// Notifica a los usuarios en la página de chats públicos sobre un nuevo mensaje no leído
							socket_io_1.default.in('chat_room_public_'.concat(roomId)).emit('event:chats.public.unread', unreadData);
						}
						if (messageObj.system) {
							return [2]; // No se necesita continuar si es un mensaje del sistema
						}
						if (isPublic) return [3 /* break */, 4];
						return [4 /* yield */, Messaging.getAllUidsInRoomFromSet('chat:room:'.concat(roomId, ':uids:online'))];
					case 3:
						uids = _b.sent();
						Messaging.pushUnreadCount(uids, unreadData);
						_b.label = 4;
					case 4:
						_b.trys.push([4, 6, , 7]);
						// Envía una notificación al usuario que recibió el mensaje
						return [4 /* yield */, sendNotification(Messaging, fromUid, roomId, messageObj)];
					case 5:
					// Envía una notificación al usuario que recibió el mensaje
						_b.sent();
						return [3 /* break */, 7];
					case 6:
						err_1 = _b.sent();
						// Manejo de errores en caso de fallo al enviar la notificación
						winston.error('[messaging/notifications] Unable to send notification\n'.concat(err_1.stack));
						return [3 /* break */, 7];
					case 7: return [2];
				}
			});
		});
	};
}

function sendNotification(Messaging, fromUid, roomId, messageObj) {
	return __awaiter(this, void 0, void 0, function () {
		let _a; let settings; let roomData; let realtimeUids; let roomDefault; let uidsToNotify; let ALLMESSAGES; let displayname; let isGroupChat; let roomName; let notifData; let icon; let
			notification;
		const _this = this;
		return __generator(this, (_b) => {
			switch (_b.label) {
				case 0: return [4 /* yield */, Promise.all([
					database_1.default.getObject('chat:room:'.concat(roomId, ':notification:settings')),
					Messaging.getRoomData(roomId, ['notificationSetting', 'roomName', 'public']), // Se especifican los campos que necesitamos
					socket_io_1.default.getUidsInRoom('chat_room_'.concat(roomId)),
				]),
					// Configuración de notificación por defecto para la sala
				];
				case 1:
					_a = _b.sent(), settings = _a[0], roomData = _a[1], realtimeUids = _a[2];
					roomDefault = roomData.notificationSetting;
					uidsToNotify = [];
					ALLMESSAGES = Messaging.notificationSettings.ALLMESSAGES;
					// Procesa a los usuarios en el conjunto de IDs en línea en la sala
					return [4 /* yield */, batch_1.default.processSortedSet('chat:room:'.concat(roomId, ':uids:online'), uids => __awaiter(_this, void 0, void 0, function () {
						let hasRead;
						return __generator(this, (_a) => {
							switch (_a.label) {
								case 0:
									// Filtra los usuarios que deben ser notificados
									uids = uids.filter(uid =>
										// Verifica si el usuario tiene habilitada la opción de recibir notificaciones para todos los mensajes
										 parseInt((settings && settings[uid]) || roomDefault.toString(), 10) === ALLMESSAGES &&
                                                // Evita notificar al remitente del mensaje
                                                fromUid !== parseInt(uid, 10) &&
                                                // Evita notificar a los usuarios que ya están en tiempo real (conectados)
                                                !realtimeUids.includes(uid));
									return [4 /* yield */, Messaging.hasRead(uids, roomId)];
								case 1:
									hasRead = _a.sent();
									// Añade a la lista de notificaciones aquellos que no hayan leído el mensaje
									uidsToNotify.push.apply(uidsToNotify, uids.filter((uid, index) => !hasRead[index]));
									return [2];
							}
						});
					}), {
						reverse: true, // Procesa los IDs de usuarios en orden inverso
						batch: 500, // Tamaño del lote a procesar
						interval: 100, // Intervalo de procesamiento entre lotes
					})];
				case 2:
					// Procesa a los usuarios en el conjunto de IDs en línea en la sala
					_b.sent();
					if (!uidsToNotify.length) return [3 /* break */, 6];
					displayname = messageObj.fromUser.displayname;
					return [4 /* yield */, Messaging.isGroupChat(roomId)];
				case 3:
					isGroupChat = _b.sent();
					roomName = roomData.roomName || '[[modules:chat.room-id, '.concat(roomId, ']]');
					notifData = {
						type: isGroupChat ? 'new-group-chat' : 'new-chat', // Tipo de notificación según si es un chat grupal o privado
						subject: roomData.roomName ?
							'[[email:notif.chat.new-message-from-user-in-room, '.concat(displayname, ', ').concat(roomName, ']]') :
							'[[email:notif.chat.new-message-from-user, '.concat(displayname, ']]'), // Asunto del email dependiendo si hay nombre de la sala o no
						bodyShort: isGroupChat || roomData.roomName ? '[[notifications:new-message-in, '.concat(roomName, ']]') : '[[notifications:new-message-from, '.concat(displayname, ']]'), // Cuerpo corto de la notificación
						bodyLong: messageObj.content, // Contenido del mensaje
						nid: 'chat_'.concat(roomId, '_').concat(fromUid, '_').concat(Date.now()), // ID único de la notificación
						mergeId: 'new-chat|'.concat(roomId), // ID para combinar notificaciones similares
						from: fromUid, // ID del remitente
						roomId: roomId, // ID de la sala
						roomName: roomName, // Nombre de la sala
						path: '/chats/'.concat(messageObj.roomId), // Ruta a la sala de chat en la interfaz
					};
					// Si la sala es pública, modifica el tipo de notificación y añade icono de la sala
					if (roomData.public) {
						icon = Messaging.getRoomIcon(roomData);
						notifData.type = 'new-public-chat';
						notifData.roomIcon = icon; // Añade el icono de la sala a la notificación
						notifData.subject = '[[email:notif.chat.new-message-from-user-in-room, '.concat(displayname, ', ').concat(roomName, ']]');
						notifData.bodyShort = '[[notifications:user-posted-in-public-room, '.concat(displayname, ', ').concat(icon, ', ').concat(roomName, ']]');
						notifData.mergeId = 'notifications:user-posted-in-public-room|'.concat(roomId); // ID para combinar notificaciones en salas públicas
					}
					return [4 /* yield */, notifications_1.default.create(notifData)];
				case 4:
					notification = _b.sent();
					return [4 /* yield */, notifications_1.default.push(notification, uidsToNotify)];
				case 5:
					_b.sent(); // Envía la notificación a los usuarios que deben ser notificados
					_b.label = 6;
				case 6: return [2];
			}
		});
	});
}
