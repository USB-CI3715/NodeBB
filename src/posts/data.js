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
const database_1 = require("../database");
const hooks = require("../plugins/hooks");
const utils = require('../utils');
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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            post.timestampISO = utils.toISOString(post.timestamp);
        }
        if (post.hasOwnProperty('edited')) {
            // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            post.editedISO = post.edited !== 0 ? utils.toISOString(post.edited) : '';
        }
    }
};

module.exports = function (Posts){
    Posts.getPostsFields = function(pids, fields) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Array.isArray(pids) || !pids.length) {
                return [];
            }
            const keys = pids.map(pid => `post:${pid}`);
            // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const postData = yield database_1.getObjects(keys, fields);
            // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
            // eslint-disable-next-line max-len
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
            const result = yield hooks.fire('filter:post.getFields', {
                pids: pids,
                posts: postData,
                fields: fields,
            });
            result.posts.forEach((post) => modifyPost(post, fields));
            return result.posts;
        });
    };
    Posts.getPostData = async function(pid) {
        return __awaiter(this, void 0, void 0, function* () {
            const posts = yield Posts.getPostsFields([pid], []);
            return posts && posts.length ? posts[0] : null;
        });
    };
    Posts.getPostsData = function(pids) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Posts.getPostsFields(pids, []);
        });
    };
    Posts.getPostFields = function(pid, fields) {
        return __awaiter(this, void 0, void 0, function* () {
            const posts = yield Posts.getPostsFields([pid], fields);
            if (posts && posts.length) {
                return posts[0];
            }
            return null;
        });
    };
    Posts.getPostField = function(pid, field) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = yield Posts.getPostFields(pid, [field]);
            if (post) {
                return post[field];
            }
            return null;
        });
    };
    Posts.setPostField = function(pid, field, value) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Posts.setPostFields(pid, { [field]: value });
        });
    };
    Posts.setPostFields = function(pid, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield (0, database_1.setObject)(`post:${pid}`, data);
            // La siguiente línea llama a una función en un módulo que aún no ha sido actualizado a TS
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            hooks.fire('action:post.setFields', { data: Object.assign(Object.assign({}, data), { pid }) });
        });
    };
}