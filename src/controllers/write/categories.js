"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.delete = exports.setModerator = exports.setPrivilege = exports.getPrivileges = exports.setWatchState = exports.getTopics = exports.getChildren = exports.getPosts = exports.getTopicCount = exports.deleteCategories = exports.update = exports.create = exports.get = exports.list = void 0;
const categories_1 = __importDefault(require("../../categories"));
const meta_1 = __importDefault(require("../../meta"));
const api_1 = __importDefault(require("../../api"));
const helpers_1 = __importDefault(require("../helpers"));
const list = async (req, res) => {
    await helpers_1.default.formatApiResponse(200, res, await api_1.default.categories.list(req));
};
exports.list = list;
const get = async (req, res) => {
    await helpers_1.default.formatApiResponse(200, res, await api_1.default.categories.get(req, req.params));
};
exports.get = get;
const create = async (req, res) => {
    const response = await api_1.default.categories.create(req, req.body);
    await helpers_1.default.formatApiResponse(200, res, response);
};
exports.create = create;
const update = async (req, res) => {
    await api_1.default.categories.update(req, {
        cid: req.params.cid,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        values: req.body,
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const categoryObjs = await categories_1.default.getCategories([req.params.cid]);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    await helpers_1.default.formatApiResponse(200, res, categoryObjs[0]);
};
exports.update = update;
const deleteCategories = async (req, res) => {
    await api_1.default.categories.delete(req, { cid: req.params.cid });
    await helpers_1.default.formatApiResponse(200, res);
};
exports.deleteCategories = deleteCategories;
exports.delete = exports.deleteCategories;
const getTopicCount = async (req, res) => {
    await helpers_1.default.formatApiResponse(200, res, await api_1.default.categories.getTopicCount(req, Object.assign({}, req.params)));
};
exports.getTopicCount = getTopicCount;
const getPosts = async (req, res) => {
    const posts = await api_1.default.categories.getPosts(req, Object.assign({}, req.params));
    await helpers_1.default.formatApiResponse(200, res, { posts });
};
exports.getPosts = getPosts;
const getChildren = async (req, res) => {
    const { cid } = req.params;
    const { start } = req.query;
    await helpers_1.default.formatApiResponse(200, res, await api_1.default.categories.getChildren(req, { cid, start }));
};
exports.getChildren = getChildren;
const getTopics = async (req, res) => {
    const { cid } = req.params;
    const result = await api_1.default.categories.getTopics(req, Object.assign(Object.assign({}, req.query), { cid }));
    await helpers_1.default.formatApiResponse(200, res, result);
};
exports.getTopics = getTopics;
const setWatchState = async (req, res) => {
    const { cid } = req.params;
    let { uid, state } = req.body;
    if (req.method === 'DELETE') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        state = categories_1.default.watchStates[meta_1.default.config.categoryWatchState];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
    }
    else if (Object.keys(categories_1.default.watchStates).includes(state)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        state = categories_1.default.watchStates[state];
    }
    else {
        throw new Error('[[error:invalid-data]]');
    }
    const { cids: modified } = await api_1.default.categories.setWatchState(req, { cid, state, uid });
    await helpers_1.default.formatApiResponse(200, res, { modified });
};
exports.setWatchState = setWatchState;
const getPrivileges = async (req, res) => {
    const privilegeSet = await api_1.default.categories.getPrivileges(req, { cid: req.params.cid });
    await helpers_1.default.formatApiResponse(200, res, privilegeSet);
};
exports.getPrivileges = getPrivileges;
const setPrivilege = async (req, res) => {
    const { cid, privilege } = req.params;
    await api_1.default.categories.setPrivilege(req, {
        cid,
        privilege,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        member: req.body.member,
        set: req.method === 'PUT',
    });
    const privilegeSet = await api_1.default.categories.getPrivileges(req, { cid: req.params.cid });
    await helpers_1.default.formatApiResponse(200, res, privilegeSet);
};
exports.setPrivilege = setPrivilege;
const setModerator = async (req, res) => {
    await api_1.default.categories.setModerator(req, {
        cid: req.params.cid,
        member: req.params.uid,
        set: req.method === 'PUT',
    });
    const privilegeSet = await api_1.default.categories.getPrivileges(req, { cid: req.params.cid });
    await helpers_1.default.formatApiResponse(200, res, privilegeSet);
};
exports.setModerator = setModerator;
