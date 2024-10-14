/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import Redis from 'ioredis';
import type { RedisCommandArgument as RedisCommandArg } from '@redis/client/dist/lib/commands';
import { execBatch } from './helpers';

interface RedisModule {
    client: Redis;
    listPrepend?: (key: string, value: RedisCommandArg) => Promise<void>;
    listAppend?: (key: string, value: RedisCommandArg) => Promise<void>;
    listRemoveLast?: (key: string) => Promise<RedisCommandArg | null>;
    listRemoveAll?: (key: string, value: RedisCommandArg | RedisCommandArg[]) => Promise<void>;
    listTrim?: (key: string, start: number, stop: number) => Promise<void>;
    getListRange?: (key: string, start: number, stop: number) => Promise<RedisCommandArg[]>;
    listLength?: (key: string) => Promise<number>;
}

const client = new Redis();

module.exports = function (module: RedisModule) {
	module.client = client;

	module.listPrepend = async function (key: string, value: RedisCommandArg): Promise<void> {
		if (!key) {
			return;
		}
		await module.client.lpush(key, value);
	};

	module.listAppend = async function (key: string, value: RedisCommandArg): Promise<void> {
		if (!key) {
			return;
		}
		await module.client.rpush(key, value);
	};

	module.listRemoveLast = async function (key: string): Promise<RedisCommandArg | null> {
		if (!key) {
			return null;
		}
		return await module.client.rpop(key);
	};

	module.listRemoveAll = async function (key: string, value: RedisCommandArg | RedisCommandArg[]): Promise<void> {
		if (!key) {
			return;
		}
		if (Array.isArray(value)) {
			const batch = module.client.pipeline();
			value.forEach(val => batch.lrem(key, 0, val));
			await execBatch(batch);
		} else {
			await module.client.lrem(key, 0, value);
		}
	};

	module.listTrim = async function (key: string, start: number, stop: number): Promise<void> {
		if (!key) {
			return;
		}
		await module.client.ltrim(key, start, stop);
	};

	module.getListRange = async function (key: string, start: number, stop: number): Promise<RedisCommandArg[]> {
		if (!key) {
			return [];
		}
		return await module.client.lrange(key, start, stop);
	};

	module.listLength = async function (key: string): Promise<number> {
		return await module.client.llen(key);
	};
};
