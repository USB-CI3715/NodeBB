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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Suggested;
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
const lodash_1 = __importDefault(require("lodash"));
const database_1 = __importDefault(require("../database"));
const user_1 = __importDefault(require("../user"));
const privileges_1 = __importDefault(require("../privileges"));
const plugins_1 = __importDefault(require("../plugins"));
function Suggested(Topics) {
    function getTidsWithSameTags(tid, tags, cutoff) {
        return __awaiter(this, void 0, void 0, function* () {
            let tids = cutoff === 0 ?
                yield database_1.default.getSortedSetRevRange(tags.map(tag => `tag:${tag}:topics`), 0, -1) :
                yield database_1.default.getSortedSetRevRangeByScore(tags.map(tag => `tag:${tag}:topics`), 0, -1, '+inf', Date.now() - cutoff);
            tids = tids.filter((_tid) => typeof _tid === 'string' && _tid !== tid);
            return lodash_1.default.shuffle(lodash_1.default.uniq(tids)).slice(0, 10);
        });
    }
    function getSearchTids(tid, title, cid, cutoff) {
        return __awaiter(this, void 0, void 0, function* () {
            let { ids: tids } = yield plugins_1.default.hooks.fire('filter:search.query', {
                index: 'topic',
                content: title,
                matchWords: 'any',
                cid: [cid],
                limit: 20,
                ids: [],
            });
            tids = tids.filter((_tid) => String(_tid) !== tid);
            if (cutoff) {
                const topicData = yield Topics.getTopicsByTids(tids, ['tid', 'timestamp']);
                const now = Date.now();
                tids = topicData.filter((t) => t && t.timestamp > now - cutoff).map((t) => t.tid);
            }
            return lodash_1.default.shuffle(tids).slice(0, 10).map(String);
        });
    }
    function getCategoryTids(tid, cid, cutoff) {
        return __awaiter(this, void 0, void 0, function* () {
            const tids = cutoff === 0 ?
                yield database_1.default.getSortedSetRevRange(`cid:${cid}:tids:lastposttime`, 0, 9) :
                yield database_1.default.getSortedSetRevRangeByScore(`cid:${cid}:tids:lastposttime`, 0, 10, '+inf', Date.now() - cutoff);
            return lodash_1.default.shuffle(tids.filter((_tid) => _tid !== tid));
        });
    }
    Topics.getSuggestedTopics = function (tid_1, uid_1, start_1, stop_1) {
        return __awaiter(this, arguments, void 0, function* (tid, uid, start, stop, cutoff = 0) {
            let tids = [];
            if (!tid) {
                return [];
            }
            tid = String(tid);
            cutoff = cutoff === 0 ? cutoff : (cutoff * 2592000000);
            const { cid, title, tags } = yield Topics.getTopicFields(tid, [
                'cid', 'title', 'tags',
            ]);
            const [tagTids, searchTids] = yield Promise.all([
                getTidsWithSameTags(tid, tags.map((t) => t.value), cutoff),
                getSearchTids(tid, title, cid, cutoff),
            ]);
            tids = lodash_1.default.uniq(tagTids.concat(searchTids));
            let categoryTids = [];
            if (stop !== -1 && tids.length < stop - start + 1) {
                categoryTids = yield getCategoryTids(tid, cid, cutoff);
            }
            tids = lodash_1.default.shuffle(lodash_1.default.uniq(tids.concat(categoryTids)));
            tids = (yield privileges_1.default.topics.filterTids('topics:read', tids, uid));
            let topicData = yield Topics.getTopicsByTids(tids, uid);
            topicData = topicData.filter((topic) => topic && String(topic.tid) !== tid);
            topicData = (yield user_1.default.blocks.filter(uid, topicData));
            topicData = topicData.slice(start, stop !== -1 ? stop + 1 : undefined)
                .sort((t1, t2) => t2.timestamp - t1.timestamp);
            Topics.calculateTopicIndices(topicData, start);
            return topicData;
        });
    };
}
