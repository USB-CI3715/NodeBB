import categories from '../../categories';
import meta from '../../meta';
import api from '../../api';
import helpers from '../helpers';

interface Params {
    cid: string;
    privilege?: string;
    uid?: string;
}

interface Request {
    params: Params;
    body: any;
    query: { start?: number };
    method: string;
}

interface Response {
    status: (code: number) => void;
    json: (data: any) => void;
}

interface WatchStateRequest extends Request {
    body: {
        uid: string;
        state: string;
    };
}

export const list = async (req: Request, res: Response) => {
	await helpers.formatApiResponse(200, res, await api.categories.list(req));
};

export const get = async (req: Request, res: Response): Promise<void> => {
	await helpers.formatApiResponse(200, res, await api.categories.get(req, req.params));
};

export const create = async (req: Request, res: Response): Promise<void> => {
	const response: unknown = await api.categories.create(req, req.body);
	await helpers.formatApiResponse(200, res, response);
};

export const update = async (req: Request, res: Response): Promise<void> => {
	await api.categories.update(req, {
		cid: req.params.cid,
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		values: req.body,
	});
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
	const categoryObjs = await categories.getCategories([req.params.cid]);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
	await helpers.formatApiResponse(200, res, categoryObjs[0]);
};

export const deleteCategories = async (req: Request, res: Response): Promise<void> => {
	await api.categories.delete(req, { cid: req.params.cid });
	await helpers.formatApiResponse(200, res);
};

export const getTopicCount = async (req: Request, res: Response): Promise<void> => {
	await helpers.formatApiResponse(200, res, await api.categories.getTopicCount(req, { ...req.params }));
};

export const getPosts = async (req: Request, res: Response): Promise<void> => {
	const posts: unknown = await api.categories.getPosts(req, { ...req.params });
	await helpers.formatApiResponse(200, res, { posts });
};

export const getChildren = async (req: Request, res: Response): Promise<void> => {
	const { cid } = req.params;
	const { start } = req.query;
	await helpers.formatApiResponse(200, res, await api.categories.getChildren(req, { cid, start }));
};

export const getTopics = async (req: Request, res: Response): Promise<void> => {
	const { cid } = req.params;
	const result: unknown = await api.categories.getTopics(req, { ...req.query, cid });
	await helpers.formatApiResponse(200, res, result);
};

export const setWatchState = async (req: WatchStateRequest, res: Response): Promise<void> => {
	const { cid } = req.params;
	let { uid, state } = req.body;

	if (req.method === 'DELETE') {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		state = categories.watchStates[meta.config.categoryWatchState];
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
	} else if (Object.keys(categories.watchStates).includes(state)) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		state = categories.watchStates[state];
	} else {
		throw new Error('[[error:invalid-data]]');
	}

	const { cids: modified } = await api.categories.setWatchState(req, { cid, state, uid });
	await helpers.formatApiResponse(200, res, { modified });
};

export const getPrivileges = async (req: Request, res: Response): Promise<void> => {
	const privilegeSet = await api.categories.getPrivileges(req, { cid: req.params.cid });
	await helpers.formatApiResponse(200, res, privilegeSet);
};

export const setPrivilege = async (req: Request, res: Response): Promise<void> => {
	const { cid, privilege } = req.params;
	await api.categories.setPrivilege(req, {
		cid,
		privilege,
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		member: req.body.member,
		set: req.method === 'PUT',
	});
	const privilegeSet = await api.categories.getPrivileges(req, { cid: req.params.cid });
	await helpers.formatApiResponse(200, res, privilegeSet);
};

export const setModerator = async (req: Request, res: Response): Promise<void> => {
	await api.categories.setModerator(req, {
		cid: req.params.cid,
		member: req.params.uid,
		set: req.method === 'PUT',
	});
	const privilegeSet = await api.categories.getPrivileges(req, { cid: req.params.cid });
	await helpers.formatApiResponse(200, res, privilegeSet);
};
export { deleteCategories as delete };
