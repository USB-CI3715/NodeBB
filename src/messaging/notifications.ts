import * as winston from 'winston'; // Importa la biblioteca 'winston' para el manejo de logs y errores
import batch from '../batch'; // Importa utilidades para procesamiento por lotes
import db from '../database'; // Importa funciones para interactuar con la base de datos
import notifications from '../notifications'; // Importa funcionalidades para manejar notificaciones
import user from '../user'; // Importa funcionalidades relacionadas con usuarios
import io from '../socket.io'; // Importa la funcionalidad de WebSockets (para comunicación en tiempo real)
import plugins from '../plugins'; // Importa funcionalidades de extensiones y plugins
// Define la estructura de un objeto de mensaje (MessageObj)
interface MessageObj {
  system?: boolean;
  content: string;
  fromUser: {
    displayname: string;
  };
  roomId: string;
}
// Define la estructura de los datos de una sala de chat (RoomData)
interface RoomData {
  roomName?: string;
  notificationSetting: number;
  public?: boolean;
}
// Define la estructura de los datos de una notificación (NotificationData)
interface NotificationData {
  type: string;
  subject: string;
  bodyShort: string;
  bodyLong: string;
  nid: string;
  mergeId: string;
  from: number;
  roomId: string;
  roomName: string;
  path: string;
  roomIcon?: string;
}
interface UnreadData {
    roomId: string;  // ID de la sala
    fromUid: number; // ID del usuario que envió el mensaje
    public: boolean; // Indica si la sala es pública o privada
  }
// Definición de la interfaz para el sistema de mensajería
interface IMessaging {
  setUserNotificationSetting(uid: number, roomId: string, value: number): Promise<void>;
  getUidsNotificationSetting(uids: string[], roomId: string): Promise<number[]>;
  markRoomNotificationsRead(uid: string, roomId: string): Promise<void>;
  notifyUsersInRoom(fromUid: number, roomId: string, messageObj: MessageObj): Promise<void>;
  getAllUidsInRoomFromSet(setKey: string): Promise<string[]>;
  pushUnreadCount(uids: string[], unreadData: UnreadData): void;
  getRoomData(roomId: string, fields: string[]): Promise<RoomData>;
  hasRead(uids: string[], roomId: string): Promise<boolean[]>;
  isGroupChat(roomId: string): Promise<boolean>;
  getRoomIcon(roomData: RoomData): string;
  notificationSettings: {
    ALLMESSAGES: number;
    MENTIONS: number;
    NONE: number;
  };
}
export default function (Messaging: IMessaging) {
    // Establece la configuración de notificaciones de un usuario en una sala
  Messaging.setUserNotificationSetting = async (uid: number, roomId: string, value: number): Promise<void> => {
    if (value === -1) {
    // Si el valor es -1, restablecer la configuración a los valores predeterminados
      await db.deleteObjectField(`chat:room:${roomId}:notification:settings`, uid);
    } else {
      // Establece el valor personalizado para el usuario en la sala  
      await db.setObjectField(`chat:room:${roomId}:notification:settings`, uid, value);
    }
  };
  // Obtiene las configuraciones de notificación de un grupo de usuarios en una sala
  Messaging.getUidsNotificationSetting = async (uids: string[], roomId: string): Promise<number[]> => {
    const [settings, roomData]: [Record<string, string>, RoomData] = await Promise.all([
      // Obtiene los ajustes personalizados de cada usuario  
      db.getObjectFields(`chat:room:${roomId}:notification:settings`, uids),
      // Obtiene la configuración de notificaciones predeterminada de la sala
      Messaging.getRoomData(roomId, ['notificationSetting']),
    ]);
    // Combina los ajustes personalizados con la configuración predeterminada
    return uids.map(uid => parseInt(settings[uid] || roomData.notificationSetting.toString(), 10));
  };
  // Marca las notificaciones de una sala como leídas para un usuario específico
  Messaging.markRoomNotificationsRead = async (uid: string, roomId: string): Promise<void> => {
    const chatNids: string[] = await db.getSortedSetScan({
      key: `uid:${uid}:notifications:unread`, // Clave donde se almacenan las notificaciones no leídas del usuario
      match: `chat_${roomId}_*`, // Busca notificaciones relacionadas con la sala especificada
    });
    if (chatNids.length) {
      // Marca las notificaciones como leídas
      await notifications.markReadMultiple(chatNids, uid);
      // Actualiza el recuento de notificaciones para el usuario
      await user.notifications.pushCount(uid);
    }
  };
  // Notifica a los usuarios de una sala sobre un nuevo mensaje
  Messaging.notifyUsersInRoom = async (fromUid: number, roomId: string, messageObj: MessageObj): Promise<void> => {
    // Comprueba si la sala es pública
    const isPublic = parseInt(await db.getObjectField(`chat:room:${roomId}`, 'public'), 10) === 1;
    let data = {
      roomId,
      fromUid,
      message: messageObj,
      public: isPublic,
    };
    // Permite a los plugins modificar los datos de la notificación
    data = await plugins.hooks.fire('filter:messaging.notify', data);
    if (!data) {
      // Si los datos fueron anulados por un plugin, no continuar
      return;
    }
    // Envía el mensaje a todos los usuarios conectados a la sala
    io.in(`chat_room_${roomId}`).emit('event:chats.receive', data);
    const unreadData = { roomId, fromUid, public: isPublic };
    if (isPublic && !messageObj.system) {
      // Notifica a los usuarios en la página de chats públicos sobre un nuevo mensaje no leído  
      io.in(`chat_room_public_${roomId}`).emit('event:chats.public.unread', unreadData);
    }
    if (messageObj.system) {
      return; // No se necesita continuar si es un mensaje del sistema
    }
    // Si la sala es privada, actualiza el recuento de mensajes no leídos
    if (!isPublic) {
      const uids = await Messaging.getAllUidsInRoomFromSet(`chat:room:${roomId}:uids:online`);
      Messaging.pushUnreadCount(uids, unreadData);
    }
    try {
      // Envía una notificación al usuario que recibió el mensaje  
      await sendNotification(Messaging,fromUid, roomId, messageObj);
    } catch (err) {
      // Manejo de errores en caso de fallo al enviar la notificación  
      winston.error(`[messaging/notifications] Unable to send notification\n${err.stack}`);
    }
  };
};
async function sendNotification(
  Messaging: IMessaging,
  fromUid: number, 
  roomId: string, 
  messageObj: MessageObj
): Promise<void> {
    const [settings, roomData, realtimeUids]: [Record<string, string>, RoomData, string[]] = await Promise.all([
        db.getObject(`chat:room:${roomId}:notification:settings`),
        Messaging.getRoomData(roomId, ['notificationSetting', 'roomName', 'public']),  // Se especifican los campos que necesitamos
        io.getUidsInRoom(`chat_room_${roomId}`),
    ])
    // Configuración de notificación por defecto para la sala
    const roomDefault = roomData.notificationSetting;
    // Arreglo donde se almacenarán los IDs de usuarios que deben ser notificados
    const uidsToNotify: string[] = [];
    // Se asume que ALLMESSAGES es un valor constante que indica que se debe notificar por todos los mensajes
    const { ALLMESSAGES } = Messaging.notificationSettings;
    // Procesa a los usuarios en el conjunto de IDs en línea en la sala
    await batch.processSortedSet(
      `chat:room:${roomId}:uids:online`,
       async (uids: string[]) => {
        // Filtra los usuarios que deben ser notificados
        uids = uids.filter(
          uid =>
            // Verifica si el usuario tiene habilitada la opción de recibir notificaciones para todos los mensajes
            parseInt((settings && settings[uid]) || roomDefault.toString(), 10) === ALLMESSAGES &&
            // Evita notificar al remitente del mensaje
            fromUid !== parseInt(uid, 10) &&
            // Evita notificar a los usuarios que ya están en tiempo real (conectados)
            !realtimeUids.includes(uid)
        );
        // Verifica si los usuarios ya han leído los mensajes en esta sala
        const hasRead = await Messaging.hasRead(uids, roomId);
        // Añade a la lista de notificaciones aquellos que no hayan leído el mensaje
        uidsToNotify.push(...uids.filter((uid, index) => !hasRead[index]));
    }, {
        reverse: true,  // Procesa los IDs de usuarios en orden inverso
        batch: 500,     // Tamaño del lote a procesar
        interval: 100,  // Intervalo de procesamiento entre lotes
    });
    // Si hay usuarios a los que se les debe notificar
    if (uidsToNotify.length) {
        // Obtiene el nombre del usuario remitente
        const { displayname } = messageObj.fromUser;
        // Verifica si la sala es un chat grupal
        const isGroupChat = await Messaging.isGroupChat(roomId);
        // Nombre de la sala (si no tiene nombre, se usa el ID de la sala)
        const roomName = roomData.roomName || `[[modules:chat.room-id, ${roomId}]]`;
        // Crea los datos para la notificación
        const notifData: NotificationData = {
            type: isGroupChat ? 'new-group-chat' : 'new-chat',  // Tipo de notificación según si es un chat grupal o privado
            subject: roomData.roomName ?
                `[[email:notif.chat.new-message-from-user-in-room, ${displayname}, ${roomName}]]` :
                `[[email:notif.chat.new-message-from-user, ${displayname}]]`,  // Asunto del email dependiendo si hay nombre de la sala o no
            bodyShort: isGroupChat || roomData.roomName ? `[[notifications:new-message-in, ${roomName}]]` : `[[notifications:new-message-from, ${displayname}]]`,  // Cuerpo corto de la notificación
            bodyLong: messageObj.content,  // Contenido del mensaje
            nid: `chat_${roomId}_${fromUid}_${Date.now()}`,  // ID único de la notificación
            mergeId: `new-chat|${roomId}`,  // ID para combinar notificaciones similares
            from: fromUid,  // ID del remitente
            roomId,  // ID de la sala
            roomName,  // Nombre de la sala
            path: `/chats/${messageObj.roomId}`,  // Ruta a la sala de chat en la interfaz
        };
        // Si la sala es pública, modifica el tipo de notificación y añade icono de la sala
        if (roomData.public) {
            const icon = Messaging.getRoomIcon(roomData);  // Obtiene el icono de la sala
            notifData.type = 'new-public-chat';
            notifData.roomIcon = icon;  // Añade el icono de la sala a la notificación
            notifData.subject = `[[email:notif.chat.new-message-from-user-in-room, ${displayname}, ${roomName}]]`;
            notifData.bodyShort = `[[notifications:user-posted-in-public-room, ${displayname}, ${icon}, ${roomName}]]`;
            notifData.mergeId = `notifications:user-posted-in-public-room|${roomId}`;  // ID para combinar notificaciones en salas públicas
        }
        // Crea y envía la notificación
        const notification = await notifications.create(notifData);
        await notifications.push(notification, uidsToNotify);  // Envía la notificación a los usuarios que deben ser notificados
    }
}