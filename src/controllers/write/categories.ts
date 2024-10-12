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

const Categories = {
	list: async (req: Request, res: Response) => {
		await helpers.formatApiResponse(200, res, await api.categories.list(req));
	},

	get: async (req: Request, res: Response) => {
		await helpers.formatApiResponse(200, res, await api.categories.get(req, req.params));
	},

	create: async (req: Request, res: Response) => {
		const response = await api.categories.create(req, req.body);
		await helpers.formatApiResponse(200, res, response);
	},

	update: async (req: Request, res: Response) => {
		await api.categories.update(req, {
			cid: req.params.cid,
			values: req.body,
		});

		const categoryObjs = await categories.getCategories([req.params.cid]);
		await helpers.formatApiResponse(200, res, categoryObjs[0]);
	},

	delete: async (req: Request, res: Response) => {
		await api.categories.delete(req, { cid: req.params.cid });
		await helpers.formatApiResponse(200, res);
	},

	getTopicCount: async (req: Request, res: Response) => {
		await helpers.formatApiResponse(200, res, await api.categories.getTopicCount(req, { ...req.params }));
	},

	getPosts: async (req: Request, res: Response) => {
		const posts = await api.categories.getPosts(req, { ...req.params });
		await helpers.formatApiResponse(200, res, { posts });
	},

	getChildren: async (req: Request, res: Response) => {
		const { cid } = req.params;
		const { start } = req.query;
		await helpers.formatApiResponse(200, res, await api.categories.getChildren(req, { cid, start }));
	},

	getTopics: async (req: Request, res: Response) => {
		const { cid } = req.params;
		const result = await api.categories.getTopics(req, { ...req.query, cid });

		await helpers.formatApiResponse(200, res, result);
	},

	setWatchState: async (req: Request, res: Response) => {
		const { cid } = req.params;
		let { uid, state } = req.body;

		if (req.method === 'DELETE') {
			state = categories.watchStates[meta.config.categoryWatchState];
		} else if (Object.keys(categories.watchStates).includes(state)) {
			state = categories.watchStates[state];
		} else {
			throw new Error('[[error:invalid-data]]');
		}

		const { cids: modified } = await api.categories.setWatchState(req, { cid, state, uid });
		await helpers.formatApiResponse(200, res, { modified });
	},

	getPrivileges: async (req: Request, res: Response) => {
		const privilegeSet = await api.categories.getPrivileges(req, { cid: req.params.cid });
		await helpers.formatApiResponse(200, res, privilegeSet);
	},

	setPrivilege: async (req: Request, res: Response) => {
		const { cid, privilege } = req.params;

		await api.categories.setPrivilege(req, {
			cid,
			privilege,
			member: req.body.member,
			set: req.method === 'PUT',
		});

		const privilegeSet = await api.categories.getPrivileges(req, { cid: req.params.cid });
		await helpers.formatApiResponse(200, res, privilegeSet);
	},

	setModerator: async (req: Request, res: Response) => {
		await api.categories.setModerator(req, {
			cid: req.params.cid,
			member: req.params.uid,
			set: req.method === 'PUT',
		});

		const privilegeSet = await api.categories.getPrivileges(req, { cid: req.params.cid });
		await helpers.formatApiResponse(200, res, privilegeSet);
	},
};

export default Categories;
