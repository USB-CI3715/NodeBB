'use strict';
//Switching 'require' to 'import'
import db from '../database';
import plugins from '../plugins';
//const db = require('../database');
//const plugins = require('../plugins');

//Creating interfaces for complex types
interface PostData{
	pid: number;
	uid: number;
	bookmarks?: number;
}

interface BookmarkStatus {
	post: PostData;
	isBookmarked: boolean;
}

export default class Posts {
//module.exports = function (Posts) {
	public static async bookmark(pid: number, uid: number): Promise<any> {
	//Posts.bookmark = async function (pid, uid) {
		return await this.toggleBookmark('bookmark', pid, uid);
	};

	public static async unbookmark(pid: number, uid: number): Promise<any> {
	//Posts.unbookmark = async function (pid, uid) {
		return await this.toggleBookmark('unbookmark', pid, uid);
	};

	private static async toggleBookmark(type: string, pid: number, uid: number): Promise<BookmarkStatus> {
	//async function toggleBookmark(type, pid, uid) {
		if (parseInt(uid, 10) <= 0) {
			throw new Error('[[error:not-logged-in]]');
		}

		const isBookmarking = type === 'bookmark';

		const postData: PostData = await Posts.getPostFields(pid, ['pid', 'uid']);
		const hasBookmarked: boolean = await Posts.hasBookmarked(pid, uid);
		/*
		const [postData, hasBookmarked] = await Promise.all([
			Posts.getPostFields(pid, ['pid', 'uid']),
			Posts.hasBookmarked(pid, uid),
		]);
*/

		if (isBookmarking && hasBookmarked) {
			throw new Error('[[error:already-bookmarked]]');
		}

		if (!isBookmarking && !hasBookmarked) {
			throw new Error('[[error:already-unbookmarked]]');
		}

		if (isBookmarking) {
			await db.sortedSetAdd(`uid:${uid}:bookmarks`, Date.now(), pid);
		} else {
			await db.sortedSetRemove(`uid:${uid}:bookmarks`, pid);
		}
		await db[isBookmarking ? 'setAdd' : 'setRemove'](`pid:${pid}:users_bookmarked`, uid);
		postData.bookmarks = await db.setCount(`pid:${pid}:users_bookmarked`);
		await Posts.setPostField(pid, 'bookmarks', postData.bookmarks);

		plugins.hooks.fire(`action:post.${type}`, {
			pid: pid,
			uid: uid,
			owner: postData.uid,
			current: hasBookmarked ? 'bookmarked' : 'unbookmarked',
		});

		return {
			post: postData,
			isBookmarked: isBookmarking,
		};
	}

	public static async hasBookmarked(pid: number, uid: number): Promise<any> {
	//Posts.hasBookmarked = async function (pid, uid) {
		if (parseInt(uid, 10) <= 0) {
			return Array.isArray(pid) ? pid.map(() => false) : false;
		}

		if (Array.isArray(pid)) {
			const sets = pid.map(pid => `pid:${pid}:users_bookmarked`);
			return await db.isMemberOfSets(sets, uid);
		}
		return await db.isSetMember(`pid:${pid}:users_bookmarked`, uid);
	};
};