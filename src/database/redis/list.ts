/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

// import type { RedisClientType } from 'redis';
import { execBatch } from './helpers';

interface Module {
    client: any;
    listPrepend(key: string, value: any): Promise<void>;
    listAppend(key: string, value: any): Promise<void>;
    listRemoveLast(key: string): Promise<any>;
    listRemoveAll(key: string, value: any): Promise<void>;
    listTrim(key: string, start: number, stop: number): Promise<void>;
    getListRange(key: string, start: number, stop: number): Promise<any>;
    listLength(key: string): Promise<number>;
}

module.exports = function (module: Module) {
	module.listPrepend = async function (key: string, value: any): Promise<void> {
		if (!key) {
			return;
		}
		await module.client.lpush(key, value);
	};


	module.listAppend = async function (key: string, value: any): Promise<void> {
		if (!key) {
			return;
		}
		await module.client.rpush(key, value);
	};


	module.listRemoveLast = async function (key: string): Promise<any> {
		if (!key) {
			return;
		}
		const result = await module.client.rpop(key);
		return result;
	};


	module.listRemoveAll = async function (key: string, value: any): Promise<void> {
		if (!key) {
			return;
		}
		if (Array.isArray(value)) {
			const batch = module.client.batch();
			value.forEach(value => batch.lRem(key, 0, value));
			await execBatch(batch);
		} else {
			await module.client.lRem(key, 0, value);
		}
	};


	module.listTrim = async function (key: string, start: number, stop: number): Promise<void> {
		if (!key) {
			return;
		}
		await module.client.ltrim(key, start, stop);
	};


	module.getListRange = async function (key: string, start: number, stop: number): Promise<any> {
		if (!key) {
			return;
		}
		const result = await module.client.lrange(key, start, stop);
		return result;
	};


	module.listLength = async function (key: string): Promise<number> {
		return await module.client.llen(key);
	};
};
