/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { createClient, RedisClientType } from 'redis';
import type { RedisCommandArgument as RedisCommandArg } from '@redis/client/dist/lib/commands';
import { execBatch } from './helpers';

interface RedisModule {
    client: RedisClientType;
    listPrepend?: (key: string, value: RedisCommandArg) => Promise<void>;
    listAppend?: (key: string, value: RedisCommandArg) => Promise<void>;
    listRemoveLast?: (key: string) => Promise<RedisCommandArg | null>;
    listRemoveAll?: (key: string, value: RedisCommandArg | RedisCommandArg[]) => Promise<void>;
    listTrim?: (key: string, start: number, stop: number) => Promise<void>;
    getListRange?: (key: string, start: number, stop: number) => Promise<RedisCommandArg[]>;
    listLength?: (key: string) => Promise<number>;
}

const client: RedisClientType = createClient();

client.on('error', err => console.log('Redis Client Error', err));

(async () => {
	await client.connect();
})().catch(err => console.error('Error initializing Redis client:', err));

module.exports = function (module: RedisModule) {
	module.client = client;

	module.listPrepend = async function (key: string, value: RedisCommandArg): Promise<void> {
		if (!key) {
			return;
		}
		await module.client.lPush(key, value);
	};

	module.listAppend = async function (key: string, value: RedisCommandArg): Promise<void> {
		if (!key) {
			return;
		}
		await module.client.rPush(key, value);
	};

	module.listRemoveLast = async function (key: string): Promise<RedisCommandArg | null> {
		if (!key) {
			return null;
		}
		return await module.client.rPop(key);
	};

	module.listRemoveAll = async function (key: string, value: RedisCommandArg | RedisCommandArg[]): Promise<void> {
		if (!key) {
			return;
		}
		if (Array.isArray(value)) {
			const batch = module.client.multi();
			value.forEach(val => batch.lRem(key, 0, val));
			await execBatch(batch);
		} else {
			await module.client.lRem(key, 0, value);
		}
	};

	module.listTrim = async function (key: string, start: number, stop: number): Promise<void> {
		if (!key) {
			return;
		}
		await module.client.lTrim(key, start, stop);
	};

	module.getListRange = async function (key: string, start: number, stop: number): Promise<RedisCommandArg[]> {
		if (!key) {
			return [];
		}
		return await module.client.lRange(key, start, stop);
	};

	module.listLength = async function (key: string): Promise<number> {
		return await module.client.lLen(key);
	};
};
