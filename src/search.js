"use strict";
/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const batch_1 = __importDefault(require("./batch"));
const categories_1 = __importDefault(require("./categories"));
const database_1 = __importDefault(require("./database"));
const plugins_1 = __importDefault(require("./plugins"));
const posts_1 = __importDefault(require("./posts"));
const privileges_1 = __importDefault(require("./privileges"));
const promisify_1 = __importDefault(require("./promisify"));
const topics_1 = __importDefault(require("./topics"));
const user_1 = __importDefault(require("./user"));
const utils_1 = __importDefault(require("./utils"));
function getWatchedCids(data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!data.categories.includes('watched')) {
            return [];
        }
        return yield user_1.default.getWatchedCategories(data.uid);
    });
}
function getChildrenCids(data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!data.searchChildren) {
            return [];
        }
        const childrenCids = yield Promise.all(data.categories.map(cid => categories_1.default.getChildrenCids(cid)));
        return yield privileges_1.default.categories.filterCids('find', (0, lodash_1.uniq)((0, lodash_1.flatten)(childrenCids)), data.uid);
    });
}
function getSearchUids(data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!data.postedBy) {
            return [];
        }
        return yield user_1.default.getUidsByUsernames(Array.isArray(data.postedBy) ? data.postedBy : [data.postedBy]);
    });
}
function getSearchCids(data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!Array.isArray(data.categories) || !data.categories.length) {
            return [];
        }
        if (data.categories.includes('all')) {
            return yield categories_1.default.getCidsByPrivilege('categories:cid', data.uid, 'read');
        }
        const [watchedCids, childrenCids] = yield Promise.all([
            getWatchedCids(data),
            getChildrenCids(data),
        ]);
        const concatenatedData = [...watchedCids, ...childrenCids, ...data.categories];
        return (0, lodash_1.uniq)(concatenatedData.filter(Boolean));
    });
}
function searchInBookmarks(data, searchCids, searchUids) {
    return __awaiter(this, void 0, void 0, function* () {
        const { uid, query, matchWords } = data;
        const allPids = [];
        yield batch_1.default.processSortedSet(`uid:${uid}:bookmarks`, (pids) => __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(searchCids) && searchCids.length) {
                pids = yield posts_1.default.filterPidsByCid(pids, searchCids);
            }
            if (Array.isArray(searchUids) && searchUids.length) {
                pids = yield posts_1.default.filterPidsByUid(pids, searchUids);
            }
            if (query) {
                const tokens = query.toString().split(' ');
                const postData = yield database_1.default.getObjectsFields(pids.map(pid => `post:${pid}`), ['content', 'tid']);
                const tids = (0, lodash_1.uniq)(postData.map((p) => p.tid));
                const topicData = yield database_1.default.getObjectsFields(tids.map(tid => `topic:${tid}`), ['title']);
                const tidToTopic = (0, lodash_1.zipObject)(tids, topicData);
                pids = pids.filter((_, i) => {
                    const content = JSON.stringify(postData[i].content);
                    const title = `${tidToTopic[postData[i].tid].title}`;
                    const method = (matchWords === 'any' ? 'some' : 'every');
                    return tokens[method](token => content.includes(token) || title.includes(token));
                });
            }
            allPids.push(...pids);
        }), {
            batch: 500,
        });
        return allPids;
    });
}
function filterByPostcount(posts, postCount, repliesFilter) {
    const parsedPostCount = parseInt(postCount, 10);
    if (postCount) {
        const filterCondition = repliesFilter === 'atleast' ?
            (post) => Number(post === null || post === void 0 ? void 0 : post.topic.postcount) >= parsedPostCount :
            (post) => Number(post === null || post === void 0 ? void 0 : post.topic.postcount) <= parsedPostCount;
        posts = posts.filter(filterCondition);
    }
    return posts;
}
function filterByTimerange(posts, timeRange, timeFilter) {
    const parsedTimeRange = parseInt(timeRange, 10) * 1000;
    if (timeRange) {
        const time = Date.now() - parsedTimeRange;
        if (timeFilter === 'newer') {
            posts = posts.filter(post => post.timestamp >= time);
        }
        else {
            posts = posts.filter(post => post.timestamp <= time);
        }
    }
    return posts;
}
function filterByTags(posts, hasTags) {
    if (Array.isArray(hasTags) && hasTags.length) {
        posts = posts.filter((post) => {
            let hasAllTags = false;
            if (post && post.topic && Array.isArray(post.topic.tags) && post.topic.tags.length) {
                hasAllTags = hasTags.every((tag) => post.topic.tags.includes(tag));
            }
            return hasAllTags;
        });
    }
    return posts;
}
function sortPosts(posts, data) {
    var _a;
    if (!posts.length || data.sortBy === 'relevance') {
        return;
    }
    data.sortDirection = data.sortDirection || 'desc';
    const direction = data.sortDirection === 'desc' ? 1 : -1;
    const fields = data.sortBy.split('.');
    if (fields.length === 1) {
        return posts.sort((post_1, post_2) => direction * (post_2[fields[0]] - post_1[fields[0]]));
    }
    const firstPost = posts[0];
    const isValid = fields && fields.length === 2 && ((_a = firstPost === null || firstPost === void 0 ? void 0 : firstPost[fields[0]]) === null || _a === void 0 ? void 0 : _a[fields[1]]);
    if (!isValid) {
        return;
    }
    const isNumeric = utils_1.default.isNumber(firstPost[fields[0]][fields[1]]);
    if (isNumeric) {
        posts.sort((post_1, post_2) => direction * (post_2[fields[0]][fields[1]] - post_1[fields[0]][fields[1]]));
    }
    else {
        posts.sort((post_1, post_2) => {
            if (post_1[fields[0]][fields[1]] > post_2[fields[0]][fields[1]]) {
                return direction;
            }
            else if (post_1[fields[0]][fields[1]] < post_2[fields[0]][fields[1]]) {
                return -direction;
            }
            return 0;
        });
    }
}
function getUsers(uids, data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (data.sortBy.startsWith('user')) {
            return yield user_1.default.getUsersFields(uids, ['username']);
        }
        return [];
    });
}
function getCategories(cids, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const categoryFields = [];
        if (data.sortBy.startsWith('category.')) {
            categoryFields.push(data.sortBy.split('.')[1]);
        }
        if (!categoryFields.length) {
            return null;
        }
        return yield database_1.default.getObjectsFields(cids.map(cid => `category:${cid}`), categoryFields);
    });
}
function getTopics(tids, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const topicsData = yield topics_1.default.getTopicsData(tids);
        const cids = (0, lodash_1.uniq)(topicsData.map((topic) => topic && topic.cid));
        const categories = yield getCategories(cids, data);
        const cidToCategory = (0, lodash_1.zipObject)(cids, categories);
        topicsData.forEach((topic) => {
            if (topic && categories && cidToCategory[topic.cid]) {
                topic.category = cidToCategory[topic.cid];
            }
            if (Array.isArray(topic.tags) && topic.tags.length > 0 && typeof topic.tags[0] !== 'string') {
                topic.tags = topic.tags.map((tag) => tag.value);
            }
        });
        return topicsData;
    });
}
function getMatchedPosts(pids, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const postFields = ['pid', 'uid', 'tid', 'timestamp', 'deleted', 'upvotes', 'downvotes'];
        let postsData = yield posts_1.default.getPostsFields(pids, postFields);
        postsData = postsData.filter((post) => post && !post.deleted);
        const uids = (0, lodash_1.uniq)(postsData.map((post) => post.uid));
        const tids = (0, lodash_1.uniq)(postsData.map((post) => post.tid));
        const [users, topics] = yield Promise.all([
            getUsers(uids, data),
            getTopics(tids, data),
        ]);
        const tidToTopic = (0, lodash_1.zipObject)(tids, topics);
        const uidToUser = (0, lodash_1.zipObject)(uids, users);
        postsData.forEach((post) => {
            if (topics && tidToTopic[post.tid]) {
                post.topic = tidToTopic[post.tid];
                if (post.topic && post.topic.category) {
                    post.category = post.topic.category;
                }
            }
            if (uidToUser[post.uid]) {
                post.user = uidToUser[post.uid];
            }
        });
        return postsData.filter((post) => post && post.topic && !post.topic.deleted);
    });
}
function filterAndSort(pids, data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (data.sortBy === 'relevance' &&
            !data.replies &&
            !data.timeRange &&
            !data.hasTags &&
            data.searchIn !== 'bookmarks' &&
            !plugins_1.default.hooks.hasListeners('filter:search.filterAndSort')) {
            return pids;
        }
        let postsData = yield getMatchedPosts(pids, data);
        if (!postsData.length) {
            return pids;
        }
        postsData = postsData.filter(Boolean);
        postsData = filterByPostcount(postsData, data.replies, data.repliesFilter);
        postsData = filterByTimerange(postsData, data.timeRange, data.timeFilter);
        postsData = filterByTags(postsData, data.hasTags);
        sortPosts(postsData, data);
        const result = yield plugins_1.default.hooks.fire('filter:search.filterAndSort', { pids: pids, posts: postsData, data: data });
        return result.posts.map((post) => post && post.pid);
    });
}
function searchInContent(data) {
    return __awaiter(this, void 0, void 0, function* () {
        data.uid = data.uid || 0;
        const [searchCids, searchUids] = yield Promise.all([
            getSearchCids(data),
            getSearchUids(data),
        ]);
        function doSearch(type, searchIn) {
            return __awaiter(this, void 0, void 0, function* () {
                if (searchIn.includes(data.searchIn)) {
                    const result = yield plugins_1.default.hooks.fire('filter:search.query', {
                        index: type,
                        content: data.query,
                        matchWords: data.matchWords || 'all',
                        cid: searchCids,
                        uid: searchUids,
                        searchData: data,
                        ids: [],
                    });
                    return Array.isArray(result) ? result : result.ids;
                }
                return [];
            });
        }
        let pids = [];
        let tids = [];
        const inTopic = `${data.query || ''}`.match(/^in:topic-([\d]+) /);
        if (inTopic) {
            const tid = inTopic[1];
            const cleanedTerm = data.query.replace(inTopic[0], '');
            pids = yield topics_1.default.search(tid, cleanedTerm);
        }
        else if (data.searchIn === 'bookmarks') {
            pids = yield searchInBookmarks(data, searchCids, searchUids);
        }
        else {
            [pids, tids] = yield Promise.all([
                doSearch('post', ['posts', 'titlesposts']),
                doSearch('topic', ['titles', 'titlesposts']),
            ]);
        }
        const mainPids = yield topics_1.default.getMainPids(tids);
        let allPids = mainPids.concat(pids).filter(Boolean);
        allPids = yield privileges_1.default.posts.filter('topics:read', allPids, data.uid);
        allPids = yield filterAndSort(allPids, data);
        const metadata = yield plugins_1.default.hooks.fire('filter:search.inContent', {
            pids: allPids,
            data: data,
        });
        if (data.returnIds) {
            const mainPidsSet = new Set(mainPids);
            const mainPidToTid = (0, lodash_1.zipObject)(mainPids, tids);
            const pidsSet = new Set(pids);
            const returnPids = allPids.filter((pid) => pidsSet.has(pid));
            const returnTids = allPids.filter((pid) => mainPidsSet.has(pid)).map(pid => mainPidToTid[pid]);
            return { pids: returnPids, tids: returnTids };
        }
        const itemsPerPage = Math.min(data.itemsPerPage || 10, 100);
        const returnData = {
            posts: [],
            matchCount: metadata.pids.length,
            pageCount: Math.max(1, Math.ceil(parseInt(metadata.pids.length, 10) / itemsPerPage)),
        };
        if (data.page) {
            const start = Math.max(0, (data.page - 1)) * itemsPerPage;
            metadata.pids = metadata.pids.slice(start, start + itemsPerPage);
        }
        returnData.posts = yield posts_1.default.getPostSummaryByPids(metadata.pids, data.uid, {});
        yield plugins_1.default.hooks.fire('filter:search.contentGetResult', { result: returnData, data: data });
        delete metadata.pids;
        delete metadata.data;
        return Object.assign(returnData, metadata);
    });
}
const search = {
    search: function (data) {
        return __awaiter(this, void 0, void 0, function* () {
            const start = process.hrtime();
            data.sortBy = data.sortBy || 'relevance';
            let result;
            if (['posts', 'titles', 'titlesposts', 'bookmarks'].includes(data.searchIn)) {
                result = yield searchInContent(data);
            }
            else if (data.searchIn === 'users') {
                result = yield user_1.default.search(data);
            }
            else if (data.searchIn === 'categories') {
                result = yield categories_1.default.search(data);
            }
            else if (data.searchIn === 'tags') {
                result = yield topics_1.default.searchAndLoadTags(data);
            }
            else if (data.searchIn) {
                result = yield plugins_1.default.hooks.fire('filter:search.searchIn', {
                    data,
                });
            }
            else {
                throw new Error('[[error:unknown-search-filter]]');
            }
            result.time = (utils_1.default.elapsedTimeSince(start) / 1000).toFixed(2);
            return result;
        });
    },
};
(0, promisify_1.default)(search);
exports.default = search;
