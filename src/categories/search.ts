// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
import * as _ from 'lodash';
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
import privileges from '../privileges';
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
import plugins from '../plugins';
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
import db from '../database';

interface SearchData {
	query?: string;
	page?: number;
	uid?: number;
	paginate?: boolean;
	resultsPerPage?: number;
	hardCap?: number;
	qs?: unknown;
}

interface Category {
	cid: number;
	parentCid: number;
	order: number;
	children?: Category[];
	subCategoriesPerPage?: number;
}

interface SearchResult {
	matchCount: number;
	pageCount?: number;
	timing?: string;
	categories?: Category[];
}

interface CategoriesInterface {
	search?: (data: SearchData) => Promise<SearchResult>;
	getCategories: (cids: number[]) => Promise<Category[]>;
	getTree: (categories: Category[], depth: number) => void;
	getRecentTopicReplies: (categories: Category[], uid: number, qs: unknown) => Promise<void>;
	getChildrenCids: (cid: number) => Promise<number[]>;
}

export default function (Categories: CategoriesInterface) {
	async function findCids(query: string, hardCap?: number): Promise<number[]> {
		if (!query || query.length < 2) {
			return [];
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const data = await db.getSortedSetScan({
			key: 'categories:name',
			match: `*${query.toLowerCase()}*`,
			limit: hardCap || 500,
		}) as string[];

		return data.map(item => parseInt(item.split(':').pop() || '0', 10));
	}

	async function getChildrenCids(cids: number[], uid: number): Promise<number[]> {
		const childrenCidsPromises = cids.map(async (cid: number) => await Categories.getChildrenCids(cid));

		const childrenCids = await Promise.all(childrenCidsPromises);
		// Ignorar errores de seguridad para la llamada a filterCids
		/* eslint-disable-next-line @typescript-eslint/no-unsafe-call,
		@typescript-eslint/no-unsafe-member-access,
		@typescript-eslint/no-unsafe-return */
		return await privileges.categories.filterCids('find', _.flatten(childrenCids), uid);
	}

	Categories.search = async function (data: SearchData): Promise<SearchResult> {
		const query = data.query || '';
		const page = data.page || 1;
		const uid = data.uid || 0;
		const paginate = data.hasOwnProperty('paginate') ? data.paginate : true;

		const startTime = process.hrtime();

		let cids = await findCids(query, data.hardCap);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const result = await plugins.hooks.fire('filter:categories.search', {
			data,
			cids,
			uid,
		}) as { cids: number[] };

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		cids = await privileges.categories.filterCids('find', result.cids, uid) as number[];

		const searchResult: SearchResult = {
			matchCount: cids.length,
		};

		if (paginate) {
			const resultsPerPage = data.resultsPerPage || 50;
			const start = Math.max(0, page - 1) * resultsPerPage;
			const stop = start + resultsPerPage;
			searchResult.pageCount = Math.ceil(cids.length / resultsPerPage);
			cids = cids.slice(start, stop);
		}

		const childrenCids = await getChildrenCids(cids, uid);
		const uniqCids = _.uniq(cids.concat(childrenCids));
		const categoryData = await Categories.getCategories(uniqCids);

		Categories.getTree(categoryData, 0);
		await Categories.getRecentTopicReplies(categoryData, uid, data.qs);

		categoryData.forEach((category: Category) => {
			if (category && Array.isArray(category.children)) {
				category.children = category.children.slice(0, category.subCategoriesPerPage);
				category.children.forEach((child: Category) => {
					child.children = undefined;
				});
			}
		});

		categoryData.sort((c1: Category, c2: Category) => {
			if (c1.parentCid !== c2.parentCid) {
				return c1.parentCid - c2.parentCid;
			}
			return c1.order - c2.order;
		});

		searchResult.timing = (process.hrtime(startTime)[1] / 1000000).toFixed(2);
		searchResult.categories = categoryData.filter((c: Category) => cids.includes(c.cid));
		return searchResult;
	};
}
