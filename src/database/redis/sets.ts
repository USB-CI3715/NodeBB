// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const helpers = require('./helpers');

interface Batch {
	sadd(key: string, value: string | string[]): void;
	srem(key: string, value: string | string[]): void;
	sismember(key: string, value: string): void;
	smembers(key: string): void;
	scard(key: string): void;
	spop(key: string): void;
	exec(): Promise<unknown[]>;
}

interface ClientRedis {
	sadd(key: string, value: string | string[]): Promise<void>;
	srem(key: string, value: string | string[]): Promise<void>;
	sismember(key: string, value: string): Promise<number>;
	smembers(key: string): Promise<string[]>;
	scard(key: string): Promise<number>;
	spop(key: string): Promise<string | null>;
	batch(): Batch;
}

interface Module {
    client: ClientRedis;
    setAdd(key: string, value: string | string[]): Promise<void>;
    setsAdd(keys: string[], value: string): Promise<void>;
    setRemove(key: string | string[], value: string | string[]): Promise<void>;
    setsRemove(keys: string[], value: string | string[]): Promise<void>;
    isSetMember(key: string, value: string): Promise<boolean>;
    isSetMembers(key: string, values: string[]): Promise<boolean[] | null>;
    isMemberOfSets(sets: string[], value: string): Promise<boolean[] | null>;
    getSetMembers(key: string): Promise<string[]>;
    getSetsMembers(keys: string[]): Promise<string[][]>;
    setCount(key: string): Promise<number>;
    setsCount(keys: string[]): Promise<number[]>;
    setRemoveRandom(key: string): Promise<string | null>;
}

module.exports = function (module: Module): Module {
	module.setAdd = async function (key: string, value: string | string[]): Promise<void> {
		if (!Array.isArray(value)) {
			value = [value];
		}
		if (!value.length) {
			return;
		}
		await module.client.sadd(key, value);
	};

	module.setsAdd = async function (keys: string[], value: string): Promise<void> {
		if (!Array.isArray(keys) || !keys.length) {
			return;
		}
		const batch = module.client.batch();
		keys.forEach(k => batch.sadd(String(k), String(value)));
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		await helpers.execBatch(batch);
	};

	module.setRemove = async function (key: string | string[], value: string | string[]): Promise<void> {
		if (!Array.isArray(value)) {
			value = [value];
		}
		if (!Array.isArray(key)) {
			key = [key];
		}
		if (!value.length) {
			return;
		}

		const batch = module.client.batch();
		key.forEach(k => batch.srem(String(k), value));
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		await helpers.execBatch(batch);
	};

	module.setsRemove = async function (keys: string[], value: string | string[]): Promise<void> {
		const batch = module.client.batch();
		keys.forEach(k => batch.srem(String(k), value));
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		await helpers.execBatch(batch);
	};

	module.isSetMember = async function (key: string, value: string): Promise<boolean> {
		const result = await module.client.sismember(key, value);
		return result === 1;
	};

	module.isSetMembers = async function (key: string, values: string[]): Promise<boolean[] | null> {
		const batch = module.client.batch();
		values.forEach(v => batch.sismember(String(key), String(v)));
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		const results = await helpers.execBatch(batch) as unknown[];
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		return results ? helpers.resultsToBool(results) as boolean[] : null;
	};

	module.isMemberOfSets = async function (sets: string[], value: string): Promise<boolean[] | null> {
		const batch = module.client.batch();
		sets.forEach(s => batch.sismember(String(s), String(value)));
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		const results = await helpers.execBatch(batch) as unknown[];
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		return results ? helpers.resultsToBool(results) as boolean[] : null;
	};

	module.getSetMembers = async function (key: string): Promise<string[]> {
		return await module.client.smembers(key);
	};

	module.getSetsMembers = async function (keys: string[]): Promise<string[][]> {
		const batch = module.client.batch();
		keys.forEach(k => batch.smembers(String(k)));
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		return await helpers.execBatch(batch) as string[][];
	};

	module.setCount = async function (key: string): Promise<number> {
		return await module.client.scard(key);
	};

	module.setsCount = async function (keys: string[]): Promise<number[]> {
		const batch = module.client.batch();
		keys.forEach(k => batch.scard(String(k)));
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		return await helpers.execBatch(batch) as number[];
	};

	module.setRemoveRandom = async function (key: string): Promise<string | null> {
		return await module.client.spop(key);
	};

	return module;
};
