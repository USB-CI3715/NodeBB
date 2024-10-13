
/* eslint-disable import/no-import-module-exports */
import * as db from '../database';
import * as io from '../socket.io';

// Interfaces para el tipado de funciones y/o variables
interface Messaging {
  getUnreadCount: (uid: string | number) => Promise<number>;
  pushUnreadCount: (uids: Array<string | number>, data?: unknown) => void;
  markRead: (uid: string | number, roomId: number) => Promise<void>;
  hasRead: (uids: Array<string | number>, roomId: number) => Promise<boolean[]>;
  markAllRead: (uid: string | number) => Promise<void>;
  markUnread: (uids: Array<string | number>, roomId: number) => Promise<void>;
  getRoomData: (roomId: number) => Promise<{ public: boolean } | null>;
  roomExists: (roomId: number) => Promise<boolean>;
}

interface TimestampData {
  [key: string]: string;
}

interface MidData {
  score: number;
}

// Codigo principal
module.exports = function (Messaging: Messaging) {
	Messaging.getUnreadCount = async (uid: string | number) => {
		if (!(parseInt(uid as string, 10) > 0)) {
			return 0;
		}
		// eslint-disable-next-line max-len
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
		return await db.sortedSetCard(`uid:${uid}:chat:rooms:unread`);
	};

	Messaging.pushUnreadCount = (uids: Array<string | number>, data: unknown = null) => {
		if (!Array.isArray(uids)) {
			uids = [uids];
		}
		uids = uids.filter(uid => parseInt(uid as string, 10) > 0);
		if (!uids.length) {
			return;
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		uids.forEach((uid) => { io.in(`uid_${uid}`).emit('event:unread.updateChatCount', data); });
	};

	Messaging.markRead = async (uid: string | number, roomId: number) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		await Promise.all([db.sortedSetRemove(`uid:${uid}:chat:rooms:unread`, roomId), db.setObjectField(`uid:${uid}:chat:rooms:read`, roomId, Date.now()),
		]);
	};

	Messaging.hasRead = async (uids: Array<string | number>, roomId: number) => {
		if (!uids.length) {
			return [];
		}

		const roomData = await Messaging.getRoomData(roomId);
		if (!roomData) {
			return uids.map(() => false);
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		if (roomData.public) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
			const [userTimestamps, mids] = await Promise.all([db.getObjectsFields(uids.map(uid => `uid:${uid}:chat:rooms:read`), [roomId]) as Promise<TimestampData[]>, db.getSortedSetRevRangeWithScores(`chat:room:${roomId}:mids`, 0, 0) as Promise<MidData[]>]);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			const lastMsgTimestamp = (mids.length > 0 && mids[0].score) ? mids[0].score : 0;
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
			return uids.map((uid, index) => !userTimestamps[index] || !userTimestamps[index][roomId] ||
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				parseInt(userTimestamps[index][roomId], 10) > lastMsgTimestamp);
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		const isMembers = await db.isMemberOfSortedSets(uids.map(uid => `uid:${uid}:chat:rooms:unread`), roomId) as boolean[];
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		return uids.map((uid, index) => !isMembers[index]);
	};
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
	Messaging.markAllRead = async (uid: string | number) => { await db.delete(`uid:${uid}:chat:rooms:unread`); };

	Messaging.markUnread = async (uids: Array<string | number>, roomId: number) => {
		const exists = await Messaging.roomExists(roomId);
		if (!exists) {
			return;
		}
		const keys = uids.map(uid => `uid:${uid}:chat:rooms:unread`);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		await db.sortedSetsAdd(keys, Date.now(), roomId);
	};
};
