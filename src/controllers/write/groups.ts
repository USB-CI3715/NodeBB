/* eslint-disable import/no-import-module-exports */
import { Request, Response } from 'express';
/* eslint-disable import/no-import-module-exports */
import api from '../../api';
/* eslint-disable import/no-import-module-exports */
import helpers from '../helpers';

export const list = async (req: Request, res: Response): Promise<void> => {
	// The following line calls a function in a module that hasn't been updated to TS yet
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await helpers.formatApiResponse(200, res, await api.groups.list(req, { ...req.query }));
};

export const exists = async (req: Request, res: Response): Promise<void> => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await helpers.formatApiResponse(200, res);
};
// export const create es una funcion que tiene como fin
export const create = async (req: Request, res: Response): Promise<void> => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	const groupData: unknown = await api.groups.create(req, req.body);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await helpers.formatApiResponse(200, res, groupData);
};

export const update = async (req: Request, res: Response): Promise<void> => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	const groupObj = await api.groups.update(req, {
		...req.body,
		slug: req.params.slug,
	}) as Record<string, unknown>;
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await helpers.formatApiResponse(200, res, groupObj);
};

export const deleteGroup = async (req: Request, res: Response): Promise<void> => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await api.groups.delete(req, req.params);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await helpers.formatApiResponse(200, res);
};

export { deleteGroup as delete };

export const listMembers = async (req: Request, res: Response): Promise<void> => {
	const { slug } = req.params;
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await helpers.formatApiResponse(200, res, await api.groups.listMembers(req, { ...req.query, slug }));
};

export const join = async (req: Request, res: Response): Promise<void> => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await api.groups.join(req, req.params);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await helpers.formatApiResponse(200, res);
};

export const leave = async (req: Request, res: Response): Promise<void> => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await api.groups.leave(req, req.params);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await helpers.formatApiResponse(200, res);
};

export const grant = async (req: Request, res: Response): Promise<void> => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await api.groups.grant(req, req.params);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await helpers.formatApiResponse(200, res);
};

export const rescind = async (req: Request, res: Response): Promise<void> => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await api.groups.rescind(req, req.params);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await helpers.formatApiResponse(200, res);
};

export const getPending = async (req: Request, res: Response): Promise<void> => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	const pending: unknown = await api.groups.getPending(req, req.params);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await helpers.formatApiResponse(200, res, { pending });
};

export const accept = async (req: Request, res: Response): Promise<void> => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await api.groups.accept(req, req.params);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await helpers.formatApiResponse(200, res);
};

export const reject = async (req: Request, res: Response): Promise<void> => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await api.groups.reject(req, req.params);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await helpers.formatApiResponse(200, res);
};

export const getInvites = async (req: Request, res: Response): Promise<void> => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	const invites: unknown = await api.groups.getInvites(req, req.params);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await helpers.formatApiResponse(200, res, { invites });
};

export const issueInvite = async (req: Request, res: Response): Promise<void> => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await api.groups.issueInvite(req, req.params);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await helpers.formatApiResponse(200, res);
};

export const acceptInvite = async (req: Request, res: Response): Promise<void> => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await api.groups.acceptInvite(req, req.params);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await helpers.formatApiResponse(200, res);
};

export const rejectInvite = async (req: Request, res: Response): Promise<void> => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await api.groups.rejectInvite(req, req.params);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	await helpers.formatApiResponse(200, res);
};
