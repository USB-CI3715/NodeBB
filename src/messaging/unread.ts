'use strict';

import db from '../database';
import io from '../socket.io';
interface Messaging {
    getUnreadCount(uid: string | number): Promise<number>;
    pushUnreadCount(uids: string[] | string, data?: any): Promise<void>;
    markRead(uid: string | number, roomId: string): Promise<void>;
    hasRead(uids: string[], roomId: string): Promise<boolean[]>;
    markAllRead(uid: string | number): Promise<void>;
    markUnread(uids: string[], roomId: string): Promise<void>;
    roomExists(roomId: string): Promise<boolean>;
    getRoomData(roomId: string): Promise<any>;
}

module.exports = function (Messaging: Messaging) {
    Messaging.getUnreadCount = async (uid: string | number): Promise<number> => {
        if (!(parseInt(uid as string, 10) > 0)) {
            return 0;
        }
        
        return await db.sortedSetCard(`uid:${uid}:chat:rooms:unread`);
    };
    
    Messaging.pushUnreadCount = async (uids: string[] | string, data: any = null): Promise<void> => {
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
    };
    
    Messaging.markRead = async (uid: string | number, roomId: string): Promise<void> => {
        await Promise.all([
            db.sortedSetRemove(`uid:${uid}:chat:rooms:unread`, roomId),
            db.setObjectField(`uid:${uid}:chat:rooms:read`, roomId, Date.now()),
        ]);
    };
    
    Messaging.hasRead = async (uids: string[], roomId: string): Promise<boolean[]> => {
        if (!uids.length) {
            return [];
        }
        
        const roomData = await Messaging.getRoomData(roomId);
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
        };
        
        Messaging.markAllRead = async (uid: string | number): Promise<void> => {
            await db.delete(`uid:${uid}:chat:rooms:unread`);
        };
        
        Messaging.markUnread = async (uids: string[], roomId: string): Promise<void> => {
            const exists = await Messaging.roomExists(roomId);
            if (!exists) {
                return;
            }
            
            const keys = uids.map(uid => `uid:${uid}:chat:rooms:unread`);
            await db.sortedSetsAdd(keys, Date.now(), roomId);
        };
    };