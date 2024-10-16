/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-multi-spaces */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
const validator = require('validator');
const _ = require('lodash');
const db = require('../database');
const meta = require('../meta');
const topics = require('../topics');
const user = require('../user');
const privileges = require('../privileges');
const plugins = require('../plugins');
const pubsub = require('../pubsub');
const utils = require('../utils');
const slugify = require('../slugify');
const translator = require('../translator');
const cache = require('./cache');

interface EditData {
	pid: number | string;
	uid: number;
	content: string;
	handle?: string;
	timestamp?: number;
	title?: string;
	tags?: string[];
	req?: Request;
}

interface CanEditResult {
	flag: boolean;
	message?: string;
}

interface PostData {
	pid: number;
	tid: number;
	uid: number;
	content: string;
	edited?: number;
	timestamp: number;
	deleted?: boolean;
}

interface TopicData {
	cid: number;
	uid: number;
	mainPid: number | string;
	title: string;
	timestamp: number;
	scheduled: boolean;
	slug: string;
	tags: Array<{ value: string }>;
}

interface EditPostData {
	content: string;
	editor: number;
	edited: number;
	timestamp?: number;
	handle?: string;
}

interface ReturnPostData extends PostData {
	cid: number;
	topic: TopicResult;
	editedISO: string;
	changed: boolean;
	oldContent: string;
	newContent: string;
}

interface TopicResult {
	tid: number;
	cid: number;
	uid: number;
	title: string;
	oldTitle: string;
	slug: string;
	isMainPost: boolean;
	renamed: boolean;
	tagsupdated: boolean;
	tags: Array<{ value: string }>;
	oldTags: Array<{ value: string }>;
	rescheduled: boolean;
}

interface PostsModule {
	edit(data: EditData): Promise<{
		topic: TopicResult;
		editor: { username: string; userslug: string };
		post: ReturnPostData;
	}>;
	getPostData(pid: number | string): Promise<PostData>;
	setPostFields(pid: number | string, data: Partial<PostData>): Promise<void>;
	diffs: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		save(diffData: any): Promise<void>;
	};
	uploads: {
		sync(pid: number | string): Promise<void>;
	};
	parsePost(postData: ReturnPostData): Promise<void>;
}

module.exports = function (Posts: PostsModule) {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	pubsub.on('post:edit', (pid: number | string) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		cache.del(pid.toString());
	});

	function rescheduling(data: EditData, topicData: TopicData): boolean {
		const isMain =
			parseInt(data.pid as string, 10) ===
			parseInt(topicData.mainPid as string, 10);
		return (
			isMain &&
			topicData.scheduled &&
			topicData.timestamp !== data.timestamp
		);
	}

	async function scheduledTopicCheck(data: EditData, topicData: TopicData) {
		if (!topicData.scheduled) {
			return;
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const canSchedule = await privileges.categories.can(
			'topics:schedule',
			topicData.cid,
			data.uid
		);
		if (!canSchedule) {
			throw new Error('[[error:no-privileges]]');
		}
		const isMain =
			parseInt(data.pid as string, 10) ===
			parseInt(topicData.mainPid as string, 10);
		if (isMain && (data.timestamp === undefined || isNaN(data.timestamp))) {
			throw new Error('[[error:invalid-data]]');
		}
	}

	function getEditPostData(
		data: EditData,
		topicData: TopicData,
		postData: PostData
	): EditPostData {
		const editPostData: EditPostData = {
			content: data.content,
			editor: data.uid,
			edited: 0,
		};

		editPostData.edited = topicData.scheduled ? (postData.edited || postData.timestamp) + 1 : Date.now();

		if (rescheduling(data, topicData)) {
			editPostData.edited = data.timestamp!;
			editPostData.timestamp = data.timestamp;
		}

		return editPostData;
	}

	async function editMainPost(
		data: EditData,
		postData: PostData,
		topicData: TopicData
	): Promise<TopicResult> {
		const { tid } = postData;
		const title = data.title ? data.title.trim() : '';

		const isMain =
			parseInt(data.pid as string, 10) ===
			parseInt(topicData.mainPid as string, 10);
		if (!isMain) {
			return {
				tid: tid,
				cid: topicData.cid,
				uid: postData.uid,
				title: topicData.title,
				oldTitle: topicData.title,
				slug: topicData.slug,
				isMainPost: false,
				renamed: false,
				tagsupdated: false,
				tags: topicData.tags,
				oldTags: topicData.tags,
				rescheduled: false,
			};
		}

		const newTopicData: Partial<TopicData> = {
			cid: topicData.cid,
			uid: postData.uid,
			mainPid: data.pid,
			timestamp: rescheduling(data, topicData) ? data.timestamp : topicData.timestamp,
		};

		if (title) {
			newTopicData.title = title;
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			newTopicData.slug = `${tid}/${slugify(title) || 'topic'}`;
		}

		const tagsupdated =
			Array.isArray(data.tags) &&
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			!_.isEqual(
				data.tags,
				topicData.tags.map(tag => tag.value)
			);

		if (tagsupdated) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			const canTag = await privileges.categories.can(
				'topics:tag',
				topicData.cid,
				data.uid
			);
			if (!canTag) {
				throw new Error('[[error:no-privileges]]');
			}
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			await topics.validateTags(data.tags, topicData.cid, data.uid, tid);
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const hookResult = await plugins.hooks.fire('filter:topic.edit', {
			req: data.req,
			topic: newTopicData,
			data: data,
		});

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		await db.setObject(`topic:${tid}`, hookResult.topic);

		if (tagsupdated) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			await topics.updateTopicTags(tid, data.tags);
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const tags = await topics.getTopicTagsObjects(tid);

		if (rescheduling(data, topicData)) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			await topics.scheduled.reschedule(newTopicData as TopicData);
		}

		const renamed =
			title &&
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			translator.escape(validator.escape(String(title))) !==
				topicData.title;

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		await plugins.hooks.fire('action:topic.edit', {
			topic: newTopicData,
			uid: data.uid,
		});

		return {
			tid: tid,
			cid: newTopicData.cid,
			uid: postData.uid,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			title: validator.escape(String(title)),
			oldTitle: topicData.title,
			slug: newTopicData.slug || topicData.slug,
			isMainPost: true,
			renamed: renamed,
			tagsupdated: tagsupdated,
			tags: tags,
			oldTags: topicData.tags,
			rescheduled: rescheduling(data, topicData),
		};
	}

	Posts.edit = async function (data: EditData) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const canEdit: CanEditResult = await privileges.posts.canEdit(
			data.pid,
			data.uid
		);
		if (!canEdit.flag) {
			throw new Error(canEdit.message || '[[error:no-privileges]]');
		}

		const postData: PostData = await Posts.getPostData(data.pid);
		if (!postData) {
			throw new Error('[[error:no-post]]');
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const topicData: TopicData = await topics.getTopicFields(postData.tid, [
			'cid',
			'mainPid',
			'title',
			'timestamp',
			'scheduled',
			'slug',
			'tags',
		]);

		await scheduledTopicCheck(data, topicData);

		const oldContent: string = postData.content;
		const editPostData: EditPostData = getEditPostData(
			data,
			topicData,
			postData
		);

		if (data.handle) {
			editPostData.handle = data.handle;
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const pluginResult = await plugins.hooks.fire('filter:post.edit', {
			req: data.req,
			post: editPostData,
			data: data,
			uid: data.uid,
		});

		const [editor, topic] = await Promise.all([
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			user.getUserFields(data.uid, ['username', 'userslug']),
			editMainPost(data, postData, topicData),
		]);

		/* eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any,
		 @typescript-eslint/no-unsafe-member-access
		*/
		await Posts.setPostFields(data.pid, pluginResult.post);
		const contentChanged =
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			data.content !== oldContent || topic.renamed || topic.tagsupdated;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		if (meta.config.enablePostHistory === 1 && contentChanged) {
			await Posts.diffs.save({
				pid: data.pid,
				uid: data.uid,
				oldContent: oldContent,
				newContent: data.content,
				edited: editPostData.edited,
				topic,
			});
		}

		await Posts.uploads.sync(data.pid);

		postData.deleted = !!postData.deleted;

		const returnPostData: ReturnPostData = {
			...postData,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			...pluginResult.post,
		};
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		returnPostData.cid = topic.cid;
		returnPostData.topic = topic;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		returnPostData.editedISO = utils.toISOString(editPostData.edited);
		returnPostData.changed = contentChanged;
		returnPostData.oldContent = oldContent;
		returnPostData.newContent = data.content;

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		await topics.notifyFollowers(returnPostData, data.uid, {
			type: 'post-edit',
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			bodyShort: translator.compile(
				'notifications:user-edited-post',
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				editor.username,
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				topic.title
			),
			nid: `edit_post:${data.pid}:uid:${data.uid}`,
		});

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		await topics.syncBacklinks(returnPostData);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		await plugins.hooks.fire('action:post.edit', {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			post: _.cloneDeep(returnPostData),
			data: data,
			uid: data.uid,
		});

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		cache.del(String(postData.pid));
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		pubsub.publish('post:edit', String(postData.pid));

		await Posts.parsePost(returnPostData);

		return {
			topic: topic,
			editor: editor,
			post: returnPostData,
		};
	};
};
