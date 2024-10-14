import _ from 'lodash';
import meta from '../meta';
import db from '../database';
import plugins from '../plugins';
import user from '../user';
import topics from '../topics';
import categories from '../categories';
import groups from '../groups';
import privileges from '../privileges';


interface PostData {
    uid: number;
    tid: number;
    content: string;
    timestamp?: number;
    isMain?: boolean;
    toPid?: number;
    ip?: string;
    handle?: string;
}

interface Post {
    pid: number;
    uid: number;
    tid: number;
    content: string;
    timestamp: number;
    toPid?: number;
    ip?: string;
    handle?: string;
    cid?: number;
    isMain?: boolean;
    deleted?: boolean;
}

function createPosts(Posts: Post) {
	async function checkToPid(toPid: number, uid: number): Promise<void> {
		const [toPost, canViewToPid] = await Promise.all([
			// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			Posts.getPostFields(toPid, ['pid', 'deleted']),
			privileges.posts.can('posts:view_deleted', toPid, uid),
		]) as [Post, boolean];
		// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const toPidExists = !!toPost.pid;
		// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		if (!toPidExists || (toPost.deleted && !canViewToPid)) {
			throw new Error('[[error:invalid-pid]]');
		}
	}
	async function addReplyTo(postData: Post, timestamp: number): Promise<void> {
		if (!postData.toPid) {
			return;
		}
		await Promise.all([
			// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			db.sortedSetAdd(`pid:${postData.toPid}:replies`, timestamp, postData.pid),
			// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			db.incrObjectField(`post:${postData.toPid}`, 'replies'),
		]);
	}
}