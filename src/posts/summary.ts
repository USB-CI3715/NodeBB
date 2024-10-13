/* This is done because the other files are using modules.export and not export default */

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-multi-spaces */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

const validator =  require('validator');
const _ = require('lodash');
const topics = require('../topics');
const user = require('../user');
const plugins = require('../plugins');
const categories = require('../categories');
const utils = require('../utils');

interface Post {
	pid: number;
	tid: number;
	content: string;
	uid: number;
	timestamp: number;
	deleted: number | boolean;
	upvotes: number;
	downvotes: number;
	replies: number;
	handle?: string | undefined;
	user?: User;
	topic?: Topic;
	category?: Category;
	isMainPost?: boolean;
	timestampISO?: string;
}

interface User {
	uid: number;
	username: string;
	userslug: string;
	picture: string;
	status: string;
}

interface Topic {
	tid: number;
	uid: number;
	title: string;
	cid: number;
	tags: string[];
	slug: string;
	deleted: number;
	scheduled: boolean;
	postcount: number;
	mainPid: number;
	teaserPid: number;
}

interface Category {
	cid: number;
	name: string;
	icon: string;
	slug: string;
	parentCid?: number;
	bgColor?: string;
	color?: string;
	backgroundImage?: string;
	imageClass?: string;
}

interface ParseOptions {
	parse: boolean;
	stripTags?: boolean;
	extraFields: string[];
}

interface Posts {
	getPostsFields(pids: number[], fields: string[]): Promise<Post[]>;
	overrideGuestHandle(post: Post, handle?: string): void;
	parsePost(post: Post): Promise<Post>;
	getPostSummaryByPids(pids: number[], uid: number, options: ParseOptions): Promise<Post[]>;
}

/* eslint-disable no-multi-spaces */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
module.exports = function (Posts:Posts) {
	function toObject<Item>(key: keyof Item, data: Item[]): Record<string | number, Item> {
		const obj: Record<string | number, Item> = {};
		data.forEach((item: Item) => {
			const itemKey = item[key];
			if (typeof itemKey === 'string' || typeof itemKey === 'number') obj[itemKey] = item;
		});	
		return obj;
	}

	function stripTags(content: string): string {
		if (content && utils) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			return utils.stripHTMLTags(content, utils.stripTags);
		}
		return content;
	}

	async function getTopicAndCategories(tids: number[]): Promise<{ topics: Topic[], categories: Category[] }> {
		const topicsData: Topic[] = await topics.getTopicsFields(tids, [
			'uid', 'tid', 'title', 'cid', 'tags', 'slug', 'deleted', 'scheduled', 'postcount', 'mainPid', 'teaserPid',
		]);

		const cids = _.uniq(topicsData.map(topic => topic && topic.cid));
		const categoriesData: Category[] = await categories.getCategoriesFields(cids, [
			'cid', 'name', 'icon', 'slug', 'parentCid', 'bgColor', 'color', 'backgroundImage', 'imageClass',
		]);

		return { topics: topicsData, categories: categoriesData };
	}

	Posts.getPostSummaryByPids = async function (pids: number[], uid: number, options: ParseOptions): Promise<Post[]> {
		if (!Array.isArray(pids) || !pids.length) {
			return [];
		}

		options.stripTags = options.hasOwnProperty('stripTags') ? options.stripTags : false;
		options.parse = options.hasOwnProperty('parse') ? options.parse : true;
		options.extraFields = options.hasOwnProperty('extraFields') ? options.extraFields : [];

		const fields = ['pid', 'tid', 'content', 'uid', 'timestamp', 'deleted', 'upvotes', 'downvotes', 'replies', 'handle'].concat(options.extraFields);

		let posts: Post[] = await Posts.getPostsFields(pids, fields);
		posts = posts.filter(Boolean);
		posts = await user.blocks.filter(uid, posts);

		const uids = _.uniq(posts.map(p => p && p.uid));
		const tids = _.uniq(posts.map(p => p && p.tid));

		const [users, topicsAndCategories] = await Promise.all([
			user.getUsersFields(uids, ['uid', 'username', 'userslug', 'picture', 'status']),
			getTopicAndCategories(tids),
		]);

		const uidToUser = toObject<User>('uid', users);
		const tidToTopic = toObject<Topic>('tid', topicsAndCategories.topics);
		const cidToCategory = toObject<Category>('cid', topicsAndCategories.categories);

		posts.forEach((post:Post) => {
			if (!uidToUser.hasOwnProperty(post.uid)) {
				post.uid = 0;
			}
			post.user = uidToUser[post.uid];
			Posts.overrideGuestHandle(post, post.handle);
			post.handle = undefined;
			post.topic = tidToTopic[post.tid];
			post.category = post.topic && cidToCategory[post.topic.cid];
			post.isMainPost = post.topic && post.pid === post.topic.mainPid;
			post.deleted = post.deleted === 1;
			post.timestampISO = utils.toISOString(post.timestamp);
		});

		posts = posts.filter(post => tidToTopic[post.tid]);

		posts = await parsePosts(posts, options);
		const result = await plugins.hooks.fire('filter:post.getPostSummaryByPids', { posts: posts, uid: uid });
		return result.posts;
	};

	async function parsePosts(posts: Post[], options: ParseOptions): Promise<Post[]> {
		return await Promise.all(posts.map(async (post) => {
			if (!post.content || !options.parse) {
				post.content = post.content ? validator.escape(String(post.content)) : post.content;
				return post;
			}
			post = await Posts.parsePost(post);
			if (options.stripTags) {
				post.content = stripTags(post.content);
			}
			return post;
		}));
	}
};