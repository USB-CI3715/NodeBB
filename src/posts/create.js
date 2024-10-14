"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const meta = require("../meta");
const db = require("../database");
const plugins = require("../plugins");
const user = require("../user");
const topics = require("../topics");
const categories = require("../categories");
const groups = require("../groups");
const privileges = require("../privileges");
function createPosts(Posts) {
    function checkToPid(toPid, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const [toPost, canViewToPid] = yield Promise.all([
                // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                Posts.getPostFields(toPid, ['pid', 'deleted']),
                privileges.posts.can('posts:view_deleted', toPid, uid),
            ]);
            // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const toPidExists = !!toPost.pid;
            // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (!toPidExists || (toPost.deleted && !canViewToPid)) {
                throw new Error('[[error:invalid-pid]]');
            }
        });
    }
    function addReplyTo(postData, timestamp) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!postData.toPid) {
                return;
            }
            yield Promise.all([
                // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                db.sortedSetAdd(`pid:${postData.toPid}:replies`, timestamp, postData.pid),
                // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                db.incrObjectField(`post:${postData.toPid}`, 'replies'),
            ]);
        });
    }
    // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    Posts.create = function (data) {
        return __awaiter(this, void 0, void 0, function* () {
            // This is an internal method, consider using Topics.reply instead
            const { uid, tid, content, timestamp = Date.now(), isMain = false } = data;
            if (!uid && parseInt(uid.toString(), 10) !== 0) {
                throw new Error('[[error:invalid-uid]]');
            }
            if (data.toPid) {
                yield checkToPid(data.toPid, uid);
            }
            // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const pid = yield db.incrObjectField('global', 'nextPid');
            let postData = {
                pid: pid,
                uid: uid,
                tid: tid,
                content: content.toString(),
                timestamp: timestamp,
            };
            if (data.toPid) {
                postData.toPid = data.toPid;
            }
            // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (data.ip && meta.config.trackIpPerPost) {
                postData.ip = data.ip;
            }
            if (data.handle && !parseInt(uid.toString(), 10)) {
                postData.handle = data.handle;
            }
            let result = yield plugins.hooks.fire('filter:post.create', { post: postData, data: data });
            // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            postData = result.post;
            // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield db.setObject(`post:${postData.pid}`, postData);
            // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            const topicData = yield topics.getTopicFields(tid, ['cid', 'pinned']);
            // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            postData.cid = topicData.cid;
            yield Promise.all([
                // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                db.sortedSetAdd('posts:pid', timestamp, postData.pid),
                // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                db.incrObjectField('global', 'postCount'),
                // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
                // eslint-disable-next-line  @typescript-eslint/no-unsafe-call
                user.onNewPostMade(postData),
                // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                topics.onNewPostMade(postData),
                // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                categories.onNewPostMade(topicData.cid, topicData.pinned, postData),
                // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                groups.onNewPostMade(postData),
                addReplyTo(postData, timestamp),
                // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                Posts.uploads.sync(postData.pid),
            ]);
            result = (yield plugins.hooks.fire('filter:post.get', { post: postData, uid: data.uid }));
            // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            result.post.isMain = isMain;
            // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            yield plugins.hooks.fire('action:post.save', { post: _.clone(result.post) });
            // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            return result.post;
        });
    };
}
module.exports = createPosts;
