/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { execBatch } from './helpers';

interface batch {
	lrem(key: string, count: number, value: string): batch;
}

interface Redis {
	lpush(key: string, value: string[] | string): Promise<number>;
	rpush(key: string, value: string[] | string): Promise<number>;
	rpop(key: string): Promise<string | null>;
	lrem(key: string, count: number, value: string): Promise<number>;
	ltrim(key: string, start: number, stop: number): Promise<string>;
	lrange(key: string, start: number, stop: number): Promise<string[]>;
	llen(key: string): Promise<number>;
	pipeline(): batch;
	exec(): Promise<void>;
}

interface RedisModule {
    client: Redis;
    listPrepend(key: string, value: string[] | string): Promise<void>;
    listAppend(key: string, value: string[] | string): Promise<void>;
    listRemoveLast(key: string): Promise<string | null>;
    listRemoveAll(key: string, value: string[] | string): Promise<void>;
    listTrim(key: string, start: number, stop: number): Promise<void>;
    getListRange(key: string, start: number, stop: number): Promise<string[] | null>;
    listLength(key: string): Promise<number>;
}


module.exports = function (module: RedisModule) {
	module.listPrepend = async function (key: string, value: string[] | string): Promise<void> {
		if (!key) {
			return;
		}
		try {
			await module.client.lpush(key, value);
		} catch (err) {
			console.error('Error in listPrepend:', err);
		}
	};

	module.listAppend = async function (key: string, value: string[] | string): Promise<void> {
		if (!key) {
			return;
		}
		try {
			await module.client.rpush(key, value);
		} catch (err) {
			console.error('Error in listAppend:', err);
		}
	};

	module.listRemoveLast = async function (key: string): Promise<string | null> {
		if (!key) {
			return null;
		}
		try {
			return await module.client.rpop(key);
		} catch (err) {
			console.error('Error in listRemoveLast:', err);
			return null;
		}
	};

	module.listRemoveAll = async function (key: string, value: string[] | string): Promise<void> {
		if (!key) {
			return;
		}
		try {
			if (Array.isArray(value)) {
				const batch = module.client.pipeline();
				value.forEach(val => batch.lrem(key, 0, val));
				await execBatch(batch);
			} else {
				await module.client.lrem(key, 0, value);
			}
		} catch (err) {
			console.error('Error in listRemoveAll:', err);
		}
	};

	module.listTrim = async function (key: string, start: number, stop: number): Promise<void> {
		if (!key) {
			return;
		}
		try {
			await module.client.ltrim(key, start, stop);
		} catch (err) {
			console.error('Error in listTrim:', err);
		}
	};

	module.getListRange = async function (key: string, start: number, stop: number): Promise<string[] | null> {
		if (!key) {
			return [];
		}
		try {
			return await module.client.lrange(key, start, stop);
		} catch (err) {
			console.error('Error in getListRange:', err);
			return [];
		}
	};

	module.listLength = async function (key: string): Promise<number> {
		if (!key) {
			return 0;
		}
		try {
			return await module.client.llen(key);
		} catch (err) {
			console.error('Error in listLength:', err);
			return 0;
		}
	};
};
