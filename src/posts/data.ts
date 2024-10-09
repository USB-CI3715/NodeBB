'use strict';

import { any } from "async";
const db = require('./src/database');
const plugins = require('./src/plugins');
const utils = require('./src/utils');

let intFields: string[] =  [
	'uid', 'pid', 'tid', 'deleted', 'timestamp',
	'upvotes', 'downvotes', 'deleterUid', 'edited',
	'replies', 'bookmarks',
];

export default function (Posts: any):any {
	Posts.getPostsFields = async function (pids:string[], fields: string[]) {
		if (!Array.isArray(pids) || !pids.length) {
			return [];
		}
		const keys = pids.map(pid => `post:${pid}`);
		const postData = await db.getObjects(keys, fields);
		const result = await plugins.hooks.fire('filter:post.getFields', {
			pids: pids,
			posts: postData,
			fields: fields,
		});
		result.posts.forEach((post: any) => modifyPost(post, fields));
		return result.posts;
	};

	Posts.getPostData = async function (pid:string) {
		const posts = await Posts.getPostsFields([pid], []);
		return posts && posts.length ? posts[0] : null;
	};

	Posts.getPostsData = async function (pids:string[]) {
		return await Posts.getPostsFields(pids, []);
	};

	Posts.getPostField = async function (pid:string, field:string) {
		const post = await Posts.getPostFields(pid, [field]);
		return post ? post[field] : null;
	};

	Posts.getPostFields = async function (pid:string, fields:string) {
		const posts = await Posts.getPostsFields([pid], fields);
		return posts ? posts[0] : null;
	};

	Posts.setPostField = async function (pid:string, field:string, value:string) {
		await Posts.setPostFields(pid, { [field]: value });
	};

	Posts.setPostFields = async function (pid:String, data:any) {
		await db.setObject(`post:${pid}`, data);
		plugins.hooks.fire('action:post.setFields', { data: { ...data, pid } });
	};
};

function modifyPost(post:any, fields:string[]): void {
	if (post) {
		db.parseIntFields(post, intFields, fields);
		if (post.hasOwnProperty('upvotes') && post.hasOwnProperty('downvotes')) {
			post.votes = post.upvotes - post.downvotes;
		}
		if (post.hasOwnProperty('timestamp')) {
			post.timestampISO = utils.toISOString(post.timestamp);
		}
		if (post.hasOwnProperty('edited')) {
			post.editedISO = post.edited !== 0 ? utils.toISOString(post.edited) : '';
		}
	}
}
