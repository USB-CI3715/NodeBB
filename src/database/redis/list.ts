/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { RedisClientType } from 'redis';
import { execBatch } from './helpers';

interface Module {
    client: RedisClientType;
    listPrepend(key: string, value: any): Promise<void>;
    listAppend(key: string, value: any): Promise<void>;
    listRemoveLast(key: string): Promise<string | null>;
    listRemoveAll(key: string, value: string[] | string): Promise<void>;
    listTrim(key: string, start: number, stop: number): Promise<void>;
    getListRange(key: string, start: number, stop: number): Promise<string[] | null>;
    listLength(key: string): Promise<number>;
}

module.exports = function (module: Module) {
	module.listPrepend = async function (key: string, value: any): Promise<void> {
		if (!key) {
			return;
		}
		await module.client.lPush(key, value);
	};


	module.listAppend = async function (key: string, value: any): Promise<void> {
		if (!key) {
			return;
		}
		await module.client.rPush(key, value);
	};


	module.listRemoveLast = async function (key: string): Promise<string | null> {
		if (!key) {
			return null;
		}
		const result = await module.client.rPop(key);
		return result || null;
	};


	module.listRemoveAll = async function (key: string, value: string[] | string): Promise<void> {
		if (!key) {
			return;
		}
		if (Array.isArray(value)) {
			const batch = module.client.multi();
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
		await module.client.lTrim(key, start, stop);
	};


	module.getListRange = async function (key: string, start: number, stop: number): Promise<string[] | null> {
		if (!key) {
			return null;
		}
		const result = await module.client.lRange(key, start, stop);
		return result || null;
	};


	module.listLength = async function (key: string): Promise<number> {
		return await module.client.lLen(key);
	};
};
