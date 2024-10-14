'use strict';

const assert = require('assert');
const nconf = require('nconf');

const db = require('./mocks/databasemock');
const topics = require('../src/topics');
const categories = require('../src/categories');
const user = require('../src/user');
const search = require('../src/search');
const privileges = require('../src/privileges');
const request = require('../src/request');

describe('Search', () => {
	let phoebeUid;
	let gingerUid;

	let topic1Data;
	let topic2Data;
	let post1Data;
	let post2Data;
	let post3Data;
	let cid1;
	let cid2;
	let cid3;

	before(async () => {
		phoebeUid = await user.create({ username: 'phoebe' });
		gingerUid = await user.create({ username: 'ginger' });
		cid1 = (
			await categories.create({
				name: 'Test Category',
				description: 'Test category created by testing script',
			})
		).cid;

		cid2 = (
			await categories.create({
				name: 'Test Category',
				description: 'Test category created by testing script',
			})
		).cid;

		cid3 = (
			await categories.create({
				name: 'Child Test Category',
				description: 'Test category created by testing script',
				parentCid: cid2,
			})
		).cid;

		({ topicData: topic1Data, postData: post1Data } = await topics.post({
			uid: phoebeUid,
			cid: cid1,
			title: 'nodebb mongodb bugs',
			content: 'avocado cucumber apple orange fox',
			tags: ['nodebb', 'bug', 'plugin', 'nodebb-plugin', 'jquery'],
		}));

		({ topicData: topic2Data, postData: post2Data } = await topics.post({
			uid: gingerUid,
			cid: cid2,
			title: 'java mongodb redis',
			content: 'avocado cucumber carrot armadillo',
			tags: ['nodebb', 'bug', 'plugin', 'nodebb-plugin', 'javascript'],
		}));
		post3Data = await topics.reply({
			uid: phoebeUid,
			content: 'reply post apple',
			tid: topic2Data.tid,
		});
	});

	it('should search term in titles and posts', async () => {
		const meta = require('../src/meta');
		const qs = `/api/search?term=cucumber&in=titlesposts&categories[]=${cid1}&by=phoebe&replies=1&repliesFilter=atleast&sortBy=timestamp&sortDirection=desc&showAs=posts`;
		await privileges.global.give(['groups:search:content'], 'guests');

		const { body } = await request.get(nconf.get('url') + qs);
		assert(body);
		assert.equal(body.matchCount, 1);
		assert.equal(body.posts.length, 1);
		assert.equal(body.posts[0].pid, post1Data.pid);
		assert.equal(body.posts[0].uid, phoebeUid);

		await privileges.global.rescind(['groups:search:content'], 'guests');
	});

	it('should search for a user', async () => {
		try {
			const data = await search.search({
				query: 'gin',
				searchIn: 'users',
			});
			assert(data);
			assert.equal(data.matchCount, 1);
			assert.equal(data.users.length, 1);
			assert.equal(data.users[0].uid, gingerUid);
			assert.equal(data.users[0].username, 'ginger');
		} catch (err) {
			assert.ifError(err);
		}
	});

	it('should search for a tag', async () => {
		const data = await search.search({
			query: 'plug',
			searchIn: 'tags',
		});
		assert(data);
		assert.equal(data.matchCount, 1);
		assert.equal(data.tags.length, 1);
		assert.equal(data.tags[0].value, 'plugin');
		assert.equal(data.tags[0].score, 2);
	});

	it('should search for a category', async () => {
		await categories.create({
			name: 'foo category',
			description: 'Test category created by testing script',
		});
		await categories.create({
			name: 'baz category',
			description: 'Test category created by testing script',
		});
		const result = await search.search({
			query: 'baz',
			searchIn: 'categories',
		});
		assert.strictEqual(result.matchCount, 1);
		assert.strictEqual(result.categories[0].name, 'baz category');
	});

	it('should search for categories', async () => {
		const socketCategories = require('../src/socket.io/categories');
		let data = await socketCategories.categorySearch(
			{ uid: phoebeUid },
			{ query: 'baz', parentCid: 0 }
		);
		assert.strictEqual(data[0].name, 'baz category');
		data = await socketCategories.categorySearch(
			{ uid: phoebeUid },
			{ query: '', parentCid: 0 }
		);
		assert.strictEqual(data.length, 5);
	});

	it('should fail if searchIn is wrong', async () => {
		try {
			await search.search({
				query: 'plug',
				searchIn: '',
			});
		} catch (err) {
			assert.equal(err.message, '[[error:unknown-search-filter]]');
		}
	});

	it('should search with tags filter', async () => {
		const data = await search.search({
			query: 'mongodb',
			searchIn: 'titles',
			hasTags: ['nodebb', 'javascript'],
		});
		assert.equal(data.posts[0].tid, topic2Data.tid);
	});

	it('should not crash if tags is not an array', async () => {
		const data = await search.search({
			query: 'mongodb',
			searchIn: 'titles',
			hasTags: 'nodebb,javascript',
		});
		assert(data);
	});

	it('should not find anything', async () => {
		const data = await search.search({
			query: 'xxxxxxxxxxxxxx',
			searchIn: 'titles',
		});
		assert(Array.isArray(data.posts));
		assert(!data.matchCount);
	});

	it('should search child categories', async () => {
		await topics.post({
			uid: gingerUid,
			cid: cid3,
			title: 'child category topic',
			content: 'avocado cucumber carrot armadillo',
		});
		const result = await search.search({
			query: 'avocado',
			searchIn: 'titlesposts',
			categories: [cid2],
			searchChildren: true,
			sortBy: 'topic.timestamp',
			sortDirection: 'desc',
		});
		assert(result.posts.length, 2);
		assert(result.posts[0].topic.title === 'child category topic');
		assert(result.posts[1].topic.title === 'java mongodb redis');
	});

	it('should return json search data with no categories', async () => {
		const qs = '/api/search?term=cucumber&in=titlesposts&searchOnly=1';
		await privileges.global.give(['groups:search:content'], 'guests');

		const { body } = await request.get(nconf.get('url') + qs);
		assert(body);
		assert(body.hasOwnProperty('matchCount'));
		assert(body.hasOwnProperty('pagination'));
		assert(body.hasOwnProperty('pageCount'));
		assert(body.hasOwnProperty('posts'));
		assert(!body.hasOwnProperty('categories'));

		await privileges.global.rescind(['groups:search:content'], 'guests');
	});

	it('should not crash without a search term', async () => {
		const qs = '/api/search';
		await privileges.global.give(['groups:search:content'], 'guests');
		const { response, body } = await request.get(nconf.get('url') + qs);
		assert(body);
		assert.strictEqual(response.statusCode, 200);
		await privileges.global.rescind(['groups:search:content'], 'guests');
	});
});
