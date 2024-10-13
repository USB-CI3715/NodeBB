var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
module.exports = function (Posts) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    pubsub.on('post:edit', (pid) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        cache.del(pid.toString());
    });
    function rescheduling(data, topicData) {
        const isMain = parseInt(data.pid, 10) ===
            parseInt(topicData.mainPid, 10);
        return (isMain &&
            topicData.scheduled &&
            topicData.timestamp !== data.timestamp);
    }
    function scheduledTopicCheck(data, topicData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!topicData.scheduled) {
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const canSchedule = yield privileges.categories.can('topics:schedule', topicData.cid, data.uid);
            if (!canSchedule) {
                throw new Error('[[error:no-privileges]]');
            }
            const isMain = parseInt(data.pid, 10) ===
                parseInt(topicData.mainPid, 10);
            if (isMain && (data.timestamp === undefined || isNaN(data.timestamp))) {
                throw new Error('[[error:invalid-data]]');
            }
        });
    }
    function getEditPostData(data, topicData, postData) {
        const editPostData = {
            content: data.content,
            editor: data.uid,
            edited: 0,
        };
        editPostData.edited = topicData.scheduled ? (postData.edited || postData.timestamp) + 1 : Date.now();
        if (rescheduling(data, topicData)) {
            editPostData.edited = data.timestamp;
            editPostData.timestamp = data.timestamp;
        }
        return editPostData;
    }
    function editMainPost(data, postData, topicData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { tid } = postData;
            const title = data.title ? data.title.trim() : '';
            const isMain = parseInt(data.pid, 10) ===
                parseInt(topicData.mainPid, 10);
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
            const newTopicData = {
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
            const tagsupdated = Array.isArray(data.tags) &&
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                !_.isEqual(data.tags, topicData.tags.map(tag => tag.value));
            if (tagsupdated) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                const canTag = yield privileges.categories.can('topics:tag', topicData.cid, data.uid);
                if (!canTag) {
                    throw new Error('[[error:no-privileges]]');
                }
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                yield topics.validateTags(data.tags, topicData.cid, data.uid, tid);
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const hookResult = yield plugins.hooks.fire('filter:topic.edit', {
                req: data.req,
                topic: newTopicData,
                data: data,
            });
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield db.setObject(`topic:${tid}`, hookResult.topic);
            if (tagsupdated) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                yield topics.updateTopicTags(tid, data.tags);
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const tags = yield topics.getTopicTagsObjects(tid);
            if (rescheduling(data, topicData)) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                yield topics.scheduled.reschedule(newTopicData);
            }
            const renamed = title &&
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                translator.escape(validator.escape(String(title))) !==
                    topicData.title;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield plugins.hooks.fire('action:topic.edit', {
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
        });
    }
    Posts.edit = function (data) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const canEdit = yield privileges.posts.canEdit(data.pid, data.uid);
            if (!canEdit.flag) {
                throw new Error(canEdit.message || '[[error:no-privileges]]');
            }
            const postData = yield Posts.getPostData(data.pid);
            if (!postData) {
                throw new Error('[[error:no-post]]');
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const topicData = yield topics.getTopicFields(postData.tid, [
                'cid',
                'mainPid',
                'title',
                'timestamp',
                'scheduled',
                'slug',
                'tags',
            ]);
            yield scheduledTopicCheck(data, topicData);
            const oldContent = postData.content;
            const editPostData = getEditPostData(data, topicData, postData);
            if (data.handle) {
                editPostData.handle = data.handle;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const pluginResult = yield plugins.hooks.fire('filter:post.edit', {
                req: data.req,
                post: editPostData,
                data: data,
                uid: data.uid,
            });
            const [editor, topic] = yield Promise.all([
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                user.getUserFields(data.uid, ['username', 'userslug']),
                editMainPost(data, postData, topicData),
            ]);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield Posts.setPostFields(data.pid, pluginResult.post);
            const contentChanged = 
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            data.content !== oldContent || topic.renamed || topic.tagsupdated;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            if (meta.config.enablePostHistory === 1 && contentChanged) {
                yield Posts.diffs.save({
                    pid: data.pid,
                    uid: data.uid,
                    oldContent: oldContent,
                    newContent: data.content,
                    edited: editPostData.edited,
                    topic,
                });
            }
            yield Posts.uploads.sync(data.pid);
            postData.deleted = !!postData.deleted;
            const returnPostData = Object.assign(Object.assign({}, postData), pluginResult.post);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            returnPostData.cid = topic.cid;
            returnPostData.topic = topic;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            returnPostData.editedISO = utils.toISOString(editPostData.edited);
            returnPostData.changed = contentChanged;
            returnPostData.oldContent = oldContent;
            returnPostData.newContent = data.content;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield topics.notifyFollowers(returnPostData, data.uid, {
                type: 'post-edit',
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                bodyShort: translator.compile('notifications:user-edited-post', 
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                editor.username, 
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                topic.title),
                nid: `edit_post:${data.pid}:uid:${data.uid}`,
            });
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield topics.syncBacklinks(returnPostData);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield plugins.hooks.fire('action:post.edit', {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                post: _.cloneDeep(returnPostData),
                data: data,
                uid: data.uid,
            });
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            cache.del(String(postData.pid));
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            pubsub.publish('post:edit', String(postData.pid));
            yield Posts.parsePost(returnPostData);
            return {
                topic: topic,
                editor: editor,
                post: returnPostData,
            };
        });
    };
};
