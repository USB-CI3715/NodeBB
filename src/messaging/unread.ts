'use strict';

import db from '../database';
import io from '../socket.io';

export function Messaging() {
    return {
        getUnreadCount: async (uid: string | number): Promise<number> => {
            if (!(parseInt(uid as string, 10) > 0)) {
                return 0;
            }
            
            const result = await db.sortedSetCard(`uid:${uid}:chat:rooms:unread`);
            return result;
        },

        pushUnreadCount: async (uids: string[] | string, data: any = null): Promise<undefined> => {
            if (!Array.isArray(uids)) {
                uids = [uids];
            }
            
            uids = uids.filter(uid => parseInt(uid as string, 10) > 0);
            
            if (!uids.length) {
                return;
            }
            
            uids.forEach((uid) => {
                io.in(`uid_${uid}`).emit('event:unread.updateChatCount', data);
            });
        },

        markRead: async (uid: string | number, roomId: string): Promise<undefined> => {
            await Promise.all([
                db.sortedSetRemove(`uid:${uid}:chat:rooms:unread`, roomId),
                db.setObjectField(`uid:${uid}:chat:rooms:read`, roomId, Date.now()),
            ]);
        },

        hasRead: async (uids: string[], roomId: string): Promise<boolean[]> => {
            if (!uids.length) {
                return [];
            }
            
            const roomData = await this.getRoomData(roomId);
            if (!roomData) {
                return uids.map(() => false);
            }
            
            if (roomData.public) {
                const [userTimestamps, mids] = await Promise.all([
                    db.getObjectsFields(uids.map(uid => `uid:${uid}:chat:rooms:read`), [roomId]),
                    db.getSortedSetRevRangeWithScores(`chat:room:${roomId}:mids`, 0, 0),
                ]);
                
                const lastMsgTimestamp = mids[0] ? mids[0].score : 0;
                return uids.map(
                    (uid, index) =>
                        !userTimestamps[index] ||
                        !userTimestamps[index][roomId] ||
                        parseInt(userTimestamps[index][roomId], 10) > lastMsgTimestamp
                );
            }
                
            const isMembers = await db.isMemberOfSortedSets(
                uids.map(uid => `uid:${uid}:chat:rooms:unread`),
                roomId
            );
                
            return uids.map((uid, index) => !isMembers[index]);
        },

        markAllRead: async (uid: string | number): Promise<undefined> => {
            await db.delete(`uid:${uid}:chat:rooms:unread`);
        },

        markUnread: async (uids: string[], roomId: string): Promise<undefined> => {
            const exists = await this.roomExists(roomId);
            if (!exists) {
              return;
            }
      
            const keys = uids.map(uid => `uid:${uid}:chat:rooms:unread`);
            await db.sortedSetsAdd(keys, Date.now(), roomId);
          },
      
          roomExists: async (roomId: string): Promise<boolean> => {
            const exists = await db.exists(`chat:room:${roomId}`);
            return exists > 0;
          },
      
          getRoomData: async (roomId: string): Promise<any> => {
            return await db.getObject(`chat:room:${roomId}`);
          }
    };
};