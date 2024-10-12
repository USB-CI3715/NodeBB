"use strict";
const database_1 = require("../database");
const plugins_1 = require("../plugins");
const utils_1 = require("../utils");
const intFields = [
    'uid', 'pid', 'tid', 'deleted', 'timestamp',
    'upvotes', 'downvotes', 'deleterUid', 'edited',
    'replies', 'bookmarks',
];
function modifyPost(post, fields) {
    if (post) {
        // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        (0, database_1.parseIntFields)(post, intFields, fields);
        if (post.hasOwnProperty('upvotes') && post.hasOwnProperty('downvotes')) {
            post.votes = post.upvotes - post.downvotes;
        }
        if (post.hasOwnProperty('timestamp')) {
            // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
            post.timestampISO = (0, utils_1.toISOString)(post.timestamp);
        }
        if (post.hasOwnProperty('edited')) {
            // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
            // eslint-disable-next-line max-len
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
            post.editedISO = post.edited !== 0 ? (0, utils_1.toISOString)(post.edited) : '';
        }
    }
}
function toExport(Posts) {
    Posts.getPostsFields = async function (pids, fields) {
        if (!Array.isArray(pids) || !pids.length) {
            return [];
        }
        const keys = pids.map(pid => `post:${pid}`);
        // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
        const postData = await (0, database_1.getObjects)(keys, fields);
        // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
        const result = await plugins_1.hooks.fire('filter:post.getFields', {
            pids: pids,
            posts: postData,
            fields: fields,
        });
        result.posts.forEach((post) => modifyPost(post, fields));
        return result.posts;
    };
    Posts.getPostData = async function (pid) {
        const posts = await Posts.getPostsFields([pid], []);
        return posts && posts.length ? posts[0] : null;
    };
    Posts.getPostsData = async function (pids) {
        return await Posts.getPostsFields(pids, []);
    };
    Posts.getPostFields = async function (pid, fields) {
        const posts = await Posts.getPostsFields([pid], fields);
        if (posts && posts.length) {
            return posts[0];
        }
        return null;
    };
    Posts.getPostField = async function (pid, field) {
        const post = await Posts.getPostFields(pid, [field]);
        if (post) {
            return post[field];
        }
        return null;
    };
    Posts.setPostField = async function (pid, field, value) {
        await Posts.setPostFields(pid, { [field]: value });
    };
    Posts.setPostFields = async function (pid, data) {
        // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        await (0, database_1.setObject)(`post:${pid}`, data);
        // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await plugins_1.hooks.fire('action:post.setFields', { data: Object.assign(Object.assign({}, data), { pid }) });
    };
}
module.exports = toExport;
