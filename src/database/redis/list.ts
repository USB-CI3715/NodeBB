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
        try {
            await module.client.lpush(key, value);
        } catch (err) {
            console.error('Error in listPrepend:', err);
        }
    };

    module.listAppend = async function (key: string, value: RedisCommandArg): Promise<void> {
        if (!key) {
            return;
        }
        try {
            await module.client.rpush(key, value);
        } catch (err) {
            console.error('Error in listAppend:', err);
        }
    };

    module.listRemoveLast = async function (key: string): Promise<RedisCommandArg | null> {
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

    module.listRemoveAll = async function (key: string, value: RedisCommandArg | RedisCommandArg[]): Promise<void> {
        if (!key) {
            return;
        }
        try {
            if (Array.isArray(value)) {
                const batch = module.client.pipeline();
                value.forEach((val) => batch.lrem(key, 0, val));
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

    module.getListRange = async function (key: string, start: number, stop: number): Promise<RedisCommandArg[]> {
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
