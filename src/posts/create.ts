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
	// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	Posts.create = async function (data: PostData): Promise<Post> {
		// This is an internal method, consider using Topics.reply instead
		const { uid, tid, content, timestamp = Date.now(), isMain = false } = data;
		if (!uid && parseInt(uid.toString(), 10) !== 0) {
			throw new Error('[[error:invalid-uid]]');
		}

		if (data.toPid) {
			await checkToPid(data.toPid, uid);
		}
		// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const pid: number = await db.incrObjectField('global', 'nextPid') as number;
		let postData: Post = {
			pid: pid,
			uid: uid,
			tid: tid,
			content: content.toString(),
			timestamp: timestamp,
		};

		if (data.toPid) {
			postData.toPid = data.toPid;
		}
		// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		if (data.ip && meta.config.trackIpPerPost) {
			postData.ip = data.ip;
		}
		if (data.handle && !parseInt(uid.toString(), 10)) {
			postData.handle = data.handle;
		}

		let result: { post: Post } = await plugins.hooks.fire('filter:post.create', { post: postData, data: data }) as { post: Post };
		// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		postData = result.post;
		// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		await db.setObject(`post:${postData.pid}`, postData);

		// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const topicData = await topics.getTopicFields(tid, ['cid', 'pinned']) as { cid: number; pinned: boolean };
		// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		postData.cid = topicData.cid;

		await Promise.all([
			// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			db.sortedSetAdd('posts:pid', timestamp, postData.pid),
			// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			db.incrObjectField('global', 'postCount'),
			// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
			// eslint-disable-next-line  @typescript-eslint/no-unsafe-call
			user.onNewPostMade(postData),
			// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			topics.onNewPostMade(postData),
			// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			categories.onNewPostMade(topicData.cid, topicData.pinned, postData),
			// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			groups.onNewPostMade(postData),
			addReplyTo(postData, timestamp),
			// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			Posts.uploads.sync(postData.pid),
		]);

		result = await plugins.hooks.fire('filter:post.get', { post: postData, uid: data.uid }) as { post: Post };
		// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		result.post.isMain = isMain;
		// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		await plugins.hooks.fire('action:post.save', { post: _.clone(result.post) });
		// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		return result.post;
	};
}