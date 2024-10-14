'use strict';

const plugins = require('../plugins');
const posts = require('../posts');

interface TopicsType {
  merge: (tids: number[], uid: number, options?: MergeOptions) => Promise<number>;
  getTopicsFields: (tids: number[], fields: string[]) => Promise<any[]>;
  getPids: (tid: number) => Promise<number[]>;
  movePostToTopic: (uid: number, pid: number, tid: number) => Promise<void>;
  setTopicField: (tid: number, field: string, value: any) => Promise<void>;
  delete: (tid: number, uid: number) => Promise<void>;
  setTopicFields: (tid: number, data: any) => Promise<void>;
  getTopicFields: (tid: number, fields: string[]) => Promise<any>;
  create: (params: any) => Promise<number>;
}

interface MergeOptions {
  mainTid?: number;
  newTopicTitle?: string;
}

function topicsModule(Topics: TopicsType) {
  const merge = async function (this: TopicsType, ...args: [number[], number, MergeOptions?]): Promise<number> {
    const [tids, uid, options = {}] = args;
    const topicsData = await this.getTopicsFields(tids, ['scheduled']);
    if (topicsData.some(t => t.scheduled)) {
      throw new Error('[[error:cant-merge-scheduled]]');
    }

    const oldestTid = findOldestTopic(tids);
    let mergeIntoTid = oldestTid;
    if (options.mainTid) {
      mergeIntoTid = options.mainTid;
    } else if (options.newTopicTitle) {
      mergeIntoTid = await createNewTopic.call(this, options.newTopicTitle, oldestTid);
    }

    const otherTids = tids.sort((a, b) => a - b)
      .filter(tid => tid && parseInt(tid.toString(), 10) !== parseInt(mergeIntoTid.toString(), 10));

    for (const tid of otherTids) {
      /* eslint-disable no-await-in-loop */
      const pids = await this.getPids(tid);
      for (const pid of pids) {
        await this.movePostToTopic(uid, pid, mergeIntoTid);
      }

      await this.setTopicField(tid, 'mainPid', 0);
      await this.delete(tid, uid);
      await this.setTopicFields(tid, {
        mergeIntoTid: mergeIntoTid,
        mergerUid: uid,
        mergedTimestamp: Date.now(),
      });
    }

    await Promise.all([
      posts.updateQueuedPostsTopic(mergeIntoTid, otherTids),
      updateViewCount.call(this, mergeIntoTid, tids),
    ]);

    await fireHook('action:topic.merge', {
      uid,
      tids,
      mergeIntoTid,
      otherTids,
    });

    return mergeIntoTid;
  };

  async function createNewTopic(this: TopicsType, title: string, oldestTid: number): Promise<number> {
    const topicData = await this.getTopicFields(oldestTid, ['uid', 'cid']);
    const params = {
      uid: topicData.uid,
      cid: topicData.cid,
      title: title,
    };
    const result = await fireHook('filter:topic.mergeCreateNewTopic', {
      oldestTid,
      params,
    });
    return this.create(result.params);
  }

  async function updateViewCount(this: TopicsType, mergeIntoTid: number, tids: number[]): Promise<number> {
    const topicData = await this.getTopicsFields(tids, ['viewcount']);
    const totalViewCount = topicData.reduce(
      (count: number, topic: any) => count + parseInt(topic.viewcount.toString(), 10), 0
    );
    await this.setTopicField(mergeIntoTid, 'viewcount', totalViewCount);
    return totalViewCount;
  }

  function findOldestTopic(tids: number[]): number {
    return Math.min(...tids);
  }

  async function fireHook(hookName: string, hookData: any): Promise<any> {
    try {
      return await plugins.hooks.fire(hookName, hookData);
    } catch (err) {
      console.error(`Error in ${hookName} hook:`, err);
      return hookData;
    }
  }

  return { merge };
}

module.exports = topicsModule;