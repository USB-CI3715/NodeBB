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
const categories_1 = __importDefault(require("../../categories"));
const meta_1 = __importDefault(require("../../meta"));
const api_1 = __importDefault(require("../../api"));
const helpers_1 = __importDefault(require("../helpers"));
const Categories = {
    list: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        yield helpers_1.default.formatApiResponse(200, res, yield api_1.default.categories.list(req));
    }),
    get: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        yield helpers_1.default.formatApiResponse(200, res, yield api_1.default.categories.get(req, req.params));
    }),
    create: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield api_1.default.categories.create(req, req.body);
        yield helpers_1.default.formatApiResponse(200, res, response);
    }),
    update: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        yield api_1.default.categories.update(req, {
            cid: req.params.cid,
            values: req.body,
        });
        const categoryObjs = yield categories_1.default.getCategories([req.params.cid]);
        yield helpers_1.default.formatApiResponse(200, res, categoryObjs[0]);
    }),
    delete: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        yield api_1.default.categories.delete(req, { cid: req.params.cid });
        yield helpers_1.default.formatApiResponse(200, res);
    }),
    getTopicCount: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        yield helpers_1.default.formatApiResponse(200, res, yield api_1.default.categories.getTopicCount(req, Object.assign({}, req.params)));
    }),
    getPosts: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const posts = yield api_1.default.categories.getPosts(req, Object.assign({}, req.params));
        yield helpers_1.default.formatApiResponse(200, res, { posts });
    }),
    getChildren: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { cid } = req.params;
        const { start } = req.query;
        yield helpers_1.default.formatApiResponse(200, res, yield api_1.default.categories.getChildren(req, { cid, start }));
    }),
    getTopics: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { cid } = req.params;
        const result = yield api_1.default.categories.getTopics(req, Object.assign(Object.assign({}, req.query), { cid }));
        yield helpers_1.default.formatApiResponse(200, res, result);
    }),
    setWatchState: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { cid } = req.params;
        let { uid, state } = req.body;
        if (req.method === 'DELETE') {
            state = categories_1.default.watchStates[meta_1.default.config.categoryWatchState];
        }
        else if (Object.keys(categories_1.default.watchStates).includes(state)) {
            state = categories_1.default.watchStates[state];
        }
        else {
            throw new Error('[[error:invalid-data]]');
        }
        const { cids: modified } = yield api_1.default.categories.setWatchState(req, { cid, state, uid });
        yield helpers_1.default.formatApiResponse(200, res, { modified });
    }),
    getPrivileges: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const privilegeSet = yield api_1.default.categories.getPrivileges(req, { cid: req.params.cid });
        yield helpers_1.default.formatApiResponse(200, res, privilegeSet);
    }),
    setPrivilege: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { cid, privilege } = req.params;
        yield api_1.default.categories.setPrivilege(req, {
            cid,
            privilege,
            member: req.body.member,
            set: req.method === 'PUT',
        });
        const privilegeSet = yield api_1.default.categories.getPrivileges(req, { cid: req.params.cid });
        yield helpers_1.default.formatApiResponse(200, res, privilegeSet);
    }),
    setModerator: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        yield api_1.default.categories.setModerator(req, {
            cid: req.params.cid,
            member: req.params.uid,
            set: req.method === 'PUT',
        });
        const privilegeSet = yield api_1.default.categories.getPrivileges(req, { cid: req.params.cid });
        yield helpers_1.default.formatApiResponse(200, res, privilegeSet);
    }),
};
exports.default = Categories;
