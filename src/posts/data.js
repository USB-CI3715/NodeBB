'use strict';

const __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	function adopt(value) { return value instanceof P ? value : new P((resolve) => { resolve(value); }); }
	const res = new (P || (P = Promise))((resolve, reject) => {
		function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
		function step(result) {
			if (result.done) {
				resolve(result.value);
			} else {
				adopt(result.value).then(fulfilled, rejected);
			}
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
	return res;
};

const db = require('../database');

const plugins = require('../plugins');

const utils = require('../utils');

const intFields = [
	'uid', 'pid', 'tid', 'deleted', 'timestamp',
	'upvotes', 'downvotes', 'deleterUid', 'edited',
	'replies', 'bookmarks',
];
module.exports = function (Posts) {
	Posts.getPostsFields = function (pids, fields) {
		return __awaiter(this, undefined, undefined, function* () {
			if (!Array.isArray(pids) || !pids.length) {
				return [];
			}
			const keys = pids.map(pid => `post:${pid}`);
			const postData = yield db.getObjects(keys, fields);
			const result = yield plugins.hooks.fire('filter:post.getFields', {
				pids: pids,
				posts: postData,
				fields: fields,
			});
			result.posts.forEach(post => modifyPost(post, fields));
			return result.posts;
		});
	};
	Posts.getPostData = async function (pid) {
		const posts = await Posts.getPostsFields([pid], []);
		return posts && posts.length ? posts[0] : null;
	};
	Posts.getPostsData = function (pids) {
		return __awaiter(this, undefined, undefined, function* () {
			return yield Posts.getPostsFields(pids, []);
		});
	};
	Posts.getPostField = function (pid, field) {
		return __awaiter(this, undefined, undefined, function* () {
			const post = yield Posts.getPostFields(pid, [field]);
			return post ? post[field] : null;
		});
	};
	Posts.getPostFields = function (pid, fields) {
		return __awaiter(this, undefined, undefined, function* () {
			const posts = yield Posts.getPostsFields([pid], fields);
			return posts ? posts[0] : null;
		});
	};
	Posts.setPostField = function (pid, field, value) {
		return __awaiter(this, undefined, undefined, function* () {
			yield Posts.setPostFields(pid, { [field]: value });
		});
	};
	Posts.setPostFields = function (pid, data) {
		return __awaiter(this, undefined, undefined, function* () {
			yield db.setObject(`post:${pid}`, data);
			plugins.hooks.fire('action:post.setFields', { data: { ...data, pid } });
		});
	};
};

function modifyPost(post, fields) {
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
