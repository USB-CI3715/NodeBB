'use strict';

import categories from '../../categories';
import meta from '../../meta';
import api from '../../api';

import helpers from '../helpers';

export const Categories: any = {};

Categories.list = async (req: any, res: any) => {
    helpers.formatApiResponse(200, res, await api.categories.list(req));
};

Categories.get = async (req: any, res: any) => {
    helpers.formatApiResponse(200, res, await api.categories.get(req, req.params));
};

Categories.create = async (req: any, res: any) => {
    const response = await api.categories.create(req, req.body);
    helpers.formatApiResponse(200, res, response);
};

Categories.update = async (req: any, res: any) => {
    await api.categories.update(req, {
        cid: req.params.cid,
        values: req.body,
    });

    const categoryObjs = await categories.getCategories([req.params.cid]);
    helpers.formatApiResponse(200, res, categoryObjs[0]);
};

Categories.delete = async (req: any, res: any) => {
    await api.categories.delete(req, { cid: req.params.cid });
    helpers.formatApiResponse(200, res);
};

Categories.getTopicCount = async (req: any, res: any) => {
    helpers.formatApiResponse(200, res, await api.categories.getTopicCount(req, { ...req.params }));
};

Categories.getPosts = async (req: any, res: any) => {
    const posts = await api.categories.getPosts(req, { ...req.params });
    helpers.formatApiResponse(200, res, { posts });
};

Categories.getChildren = async (req: any, res: any) => {
    const { cid } = req.params;
    const { start } = req.query;
    helpers.formatApiResponse(200, res, await api.categories.getChildren(req, { cid, start }));
};

Categories.getTopics = async (req: any, res: any) => {
    const { cid } = req.params;
    const result = await api.categories.getTopics(req, { ...req.query, cid });

    helpers.formatApiResponse(200, res, result);
};

Categories.setWatchState = async (req: any, res: any) => {
    const { cid } = req.params;
    let { uid, state } = req.body;

    if (req.method === 'DELETE') {
        // DELETE is always setting state to system default in acp
        state = categories.watchStates[meta.config.categoryWatchState];
    } else if (Object.keys(categories.watchStates).includes(state)) {
        state = categories.watchStates[state]; // convert to integer for backend processing
    } else {
        throw new Error('[[error:invalid-data]]');
    }

    const { cids: modified } = await api.categories.setWatchState(req, { cid, state, uid });

    helpers.formatApiResponse(200, res, { modified });
};

Categories.getPrivileges = async (req: any, res: any) => {
    const privilegeSet = await api.categories.getPrivileges(req, { cid: req.params.cid });
    helpers.formatApiResponse(200, res, privilegeSet);
};

Categories.setPrivilege = async (req: any, res: any) => {
    const { cid, privilege } = req.params;

    await api.categories.setPrivilege(req, {
        cid,
        privilege,
        member: req.body.member,
        set: req.method === 'PUT',
    });

    const privilegeSet = await api.categories.getPrivileges(req, { cid: req.params.cid });
    helpers.formatApiResponse(200, res, privilegeSet);
};

Categories.setModerator = async (req: any, res: any) => {
    await api.categories.setModerator(req, {
        cid: req.params.cid,
        member: req.params.uid,
        set: req.method === 'PUT',
    });

    const privilegeSet = await api.categories.getPrivileges(req, { cid: req.params.cid });
    helpers.formatApiResponse(200, res, privilegeSet);
};
