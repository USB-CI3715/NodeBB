/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import _ from 'lodash';
import db from '../database';
import user from '../user';
import privileges from '../privileges';
import plugins from '../plugins';

interface Topic {
  tid: string;
  timestamp: number;
}

interface TopicFields {
  cid: string;
  title: string;
  tags: { value: string }[];
}

interface TopicsType {
  getTopicFields: (tid: string, fields: string[]) => Promise<TopicFields>;
  getTopicsByTids: (tids: string[], uid: string[]) => Promise<Topic[]>;
  calculateTopicIndices: (topics: Topic[], start: number) => void;
  getSuggestedTopics?: (
    tid: string,
    uid: string[],
    start: number,
    stop: number,
    cutoff?: number
  ) => Promise<Topic[]>;
}

export default function Suggested(Topics: TopicsType) {
	async function getTidsWithSameTags(tid: string, tags: string[], cutoff: number): Promise<string[]> {
		let tids: string[] = cutoff === 0 ?
			await db.getSortedSetRevRange(tags.map(tag => `tag:${tag}:topics`), 0, -1) as string[] :
			await db.getSortedSetRevRangeByScore(tags.map(tag => `tag:${tag}:topics`), 0, -1, '+inf', Date.now() - cutoff) as string[];

		tids = tids.filter((_tid: string) => typeof _tid === 'string' && _tid !== tid);
		return _.shuffle(_.uniq(tids)).slice(0, 10) as string[];
	}

	async function getSearchTids(tid: string, title: string, cid: string, cutoff: number): Promise<string[]> {
		let { ids: tids } = await plugins.hooks.fire('filter:search.query', {
			index: 'topic',
			content: title,
			matchWords: 'any',
			cid: [cid],
			limit: 20,
			ids: [] as string[],
		}) as { ids: string[] };
		tids = tids.filter((_tid: string) => String(_tid) !== tid);
		if (cutoff) {
			const topicData = await Topics.getTopicsByTids(tids, ['tid', 'timestamp']);
			const now = Date.now();
			tids = topicData.filter((t: Topic) => t && t.timestamp > now - cutoff).map((t: Topic) => t.tid);
		}

		return _.shuffle(tids).slice(0, 10).map(String) as string[];
	}

	async function getCategoryTids(tid: string, cid: string, cutoff: number): Promise<string[]> {
		const tids = cutoff === 0 ?
			await db.getSortedSetRevRange(`cid:${cid}:tids:lastposttime`, 0, 9) as string[] :
			await db.getSortedSetRevRangeByScore(`cid:${cid}:tids:lastposttime`, 0, 10, '+inf', Date.now() - cutoff) as string[];
		return _.shuffle(tids.filter((_tid: string) => _tid !== tid)) as string[];
	}

	Topics.getSuggestedTopics = async function (
		tid: string,
		uid: string[],
		start: number,
		stop: number,
		cutoff: number = 0
	): Promise<Topic[]> {
		let tids: string[] = [];
		if (!tid) {
			return [];
		}
		tid = String(tid);
		cutoff = cutoff === 0 ? cutoff : (cutoff * 2592000000);
		const { cid, title, tags } = await Topics.getTopicFields(tid, [
			'cid', 'title', 'tags',
		]);

		const [tagTids, searchTids] = await Promise.all([
			getTidsWithSameTags(tid, tags.map((t: { value: string }) => t.value), cutoff),
			getSearchTids(tid, title, cid, cutoff),
		]);

		tids = _.uniq(tagTids.concat(searchTids)) as string[];

		let categoryTids: string[] = [];
		if (stop !== -1 && tids.length < stop - start + 1) {
			categoryTids = await getCategoryTids(tid, cid, cutoff);
		}
		tids = _.shuffle(_.uniq(tids.concat(categoryTids))) as string[];
		tids = await privileges.topics.filterTids('topics:read', tids, uid) as string[];

		let topicData = await Topics.getTopicsByTids(tids, uid);
		topicData = topicData.filter((topic: Topic) => topic && String(topic.tid) !== tid);
		topicData = await user.blocks.filter(uid, topicData) as Topic[];
		topicData = topicData.slice(start, stop !== -1 ? stop + 1 : undefined)
			.sort((t1: Topic, t2: Topic) => t2.timestamp - t1.timestamp);
		Topics.calculateTopicIndices(topicData, start);
		return topicData;
	};
}
