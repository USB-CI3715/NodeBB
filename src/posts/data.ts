import { getObjects, setObject, parseIntFields } from '../database';
import { hooks } from '../plugins';
import { toISOString } from '../utils';

const intFields: string[] = [
	'uid', 'pid', 'tid', 'deleted', 'timestamp',
	'upvotes', 'downvotes', 'deleterUid', 'edited',
	'replies', 'bookmarks',
];

interface Post {
	votes: number;
	upvotes: number;
	downvotes: number;
	timestamp: number;
	timestampISO: string;
	edited: number;
	editedISO: string;
}

interface Posts {
	getPostsFields: (pids:string[], fields: string[]) => Promise<object[]>
	getPostData: (pid:string) => Promise<object>
	getPostsData: (pids:string[]) => Promise<object[]>
	getPostFields: (pid:string, fields:string[]) => Promise<object | null>
	getPostField: (pid:string, field:string) => Promise<object | null>
	setPostField: (pid:string, field:string, value:string) => Promise<void>
	setPostFields: (pid:string, data:object) => Promise<void>
}


function modifyPost(post:Post, fields:string[]): void {
	if (post) {
		// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		parseIntFields(post, intFields, fields);
		if (post.hasOwnProperty('upvotes') && post.hasOwnProperty('downvotes')) {
			post.votes = post.upvotes - post.downvotes;
		}
		if (post.hasOwnProperty('timestamp')) {
			// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
			post.timestampISO = toISOString(post.timestamp);
		}
		if (post.hasOwnProperty('edited')) {
			// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
			post.editedISO = post.edited !== 0 ? toISOString(post.edited) : '';
		}
	}
}

function toExport(Posts:Posts):void {
	Posts.getPostsFields = async function (pids:string[], fields: string[]): Promise<object[]> {
		if (!Array.isArray(pids) || !pids.length) {
			return [];
		}
		const keys = pids.map(pid => `post:${pid}`);
		// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		const postData: Post[] = await getObjects(keys, fields);
		// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
		// eslint-disable-next-line max-len
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		const result: { pids: string[], posts: Post[], fields: string[] } = await hooks.fire('filter:post.getFields', {
			pids: pids,
			posts: postData,
			fields: fields,
		});
		result.posts.forEach((post: Post) => modifyPost(post, fields));
		return result.posts;
	};

	Posts.getPostData = async function (pid:string): Promise<object | null> {
		const posts:object[] = await Posts.getPostsFields([pid], []);
		return posts && posts.length ? posts[0] : null;
	};

	Posts.getPostsData = async function (pids:string[]):Promise<object[]> {
		return await Posts.getPostsFields(pids, []);
	};

	Posts.getPostFields = async function (pid:string, fields:string[]): Promise<object | null> {
		const posts: object[] = await Posts.getPostsFields([pid], fields);
		if (posts && posts.length) {
			return posts[0];
		}
		return null;
	};

	Posts.getPostField = async function (pid:string, field:string): Promise<object | null> {
		const post: object = await Posts.getPostFields(pid, [field]);
		if (post) {
			return post[field] as object;
		}
		return null;
	};

	Posts.setPostField = async function (pid:string, field:string, value:string):Promise<void> {
		await Posts.setPostFields(pid, { [field]: value });
	};

	Posts.setPostFields = async function (pid:string, data:object): Promise<void> {
		// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		await setObject(`post:${pid}`, data);
		// La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		await hooks.fire('action:post.setFields', { data: { ...data, pid } });
	};
}

export = toExport


