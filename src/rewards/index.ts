/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import * as util from 'util';
import * as db from '../database';
import * as plugins from '../plugins';
import promisify from '../promisify';

interface Reward {
	id: string;
	disabled?: boolean | string;
	claimable: string;
}

interface RewardData extends Reward {
	conditional: string;
	value: number;
}

interface Params {
	uid: string;
	condition: string;
	method: () => Promise<number> | (() => number);
}

interface DbObject {
	value: string;
	score: string;
}

interface RewardsModule {
	checkConditionAndRewardUser: (params: Params) => Promise<void>;
}

async function isConditionActive(condition: string): Promise<boolean> {
	try {
		const isMember: boolean = await db.isSetMember('conditions:active', condition) as boolean;
		return isMember;
	} catch (err) {
		console.error('Error in isConditionActive: ', err);
		return false;
	}
}

async function getIDsByCondition(condition: string): Promise<string[]> {
	try {
		const members: string[] = await db.getSetMembers(`condition:${condition}:rewards`) as string[];
		return members;
	} catch (err) {
		console.error('Error in getIDsByCondition: ', err);
		return [];
	}
}

async function filterCompletedRewards(uid: string, rewards: RewardData[]): Promise<RewardData[]> {
	try {
		const data = await db.getSortedSetRangeByScoreWithScores(`uid:${uid}:rewards`, 0, -1, 1, '+inf') as DbObject[];
		const userRewards: Record<string, number> = {};

		data.forEach((obj: DbObject) => {
			userRewards[obj.value] = parseInt(obj.score, 10);
		});

		return rewards.filter((reward) => {
			if (!reward) {
				return false;
			}

			const claimable = parseInt(reward.claimable, 10);
			return claimable === 0 || (!userRewards[reward.id] || userRewards[reward.id] < claimable);
		});
	} catch (err) {
		console.error('Error filtering completed rewards: ', err);
		return [];
	}
}

async function getRewardDataByIDs(ids: string[]): Promise<RewardData[]> {
	try {
		const rewardsData: RewardData[] = await db.getObjects(ids.map(id => `rewards:id:${id}`)) as RewardData[];
		return rewardsData;
	} catch (err) {
		console.error('Error in getRewardDataByIDs: ', err);
		return [];
	}
}

async function getRewardsByRewardData(rewards: RewardData[]): Promise<RewardData[]> {
	try {
		const rewardObjects: RewardData[] = await db.getObjects(rewards.map(reward => `rewards:id:${reward.id}:rewards`)) as RewardData[];
		return rewardObjects;
	} catch (err) {
		console.error('Error in getRewardsByRewardData: ', err);
		return [];
	}
}

async function checkCondition(reward: RewardData, method: () => Promise<number> | (() => number)): Promise<boolean> {
	try {
		if (method.constructor && method.constructor.name !== 'AsyncFunction') {
			method = util.promisify(method as unknown as () => number);
		}
		const value = await method();
		const bool: boolean = await plugins.hooks.fire(`filter:rewards.checkConditional:${reward.conditional}`, { left: value, right: reward.value }) as boolean;
		return bool;
	} catch (err) {
		console.error(`Error in checkCondition for reward ${reward.id}:`, err);
		return false;
	}
}

async function giveRewards(uid: string, rewards: RewardData[]): Promise<void> {
	const rewardData = await getRewardsByRewardData(rewards);

	// Ejecutar en paralelo las operaciones de dar premios
	await Promise.all(rewards.map(async (reward, i) => {
		try {
			await plugins.hooks.fire(`action:rewards.award:${reward.id}`, {
				uid: uid,
				rewardData: reward,
				reward: rewardData[i],
			});
			await db.sortedSetIncrBy(`uid:${uid}:rewards`, 1, reward.id);
		} catch (err) {
			console.error(`Error awarding reward ${reward.id}:`, err);
		}
	}));
}

const rewards: RewardsModule = {
	async checkConditionAndRewardUser(params: Params): Promise<void> {
		const { uid, condition, method } = params;
		console.log('Starting to check condition for user:', uid);

		const isActive = await isConditionActive(condition);
		console.log('Condition active:', isActive);
		if (!isActive) {
			return;
		}

		const ids = await getIDsByCondition(condition);
		console.log('Condition IDs retrieved:', ids);
		let rewardData: RewardData[] = await getRewardDataByIDs(ids);

		// Filtrar los deshabilitados
		rewardData = rewardData.filter(r => r && !(r.disabled === 'true' || r.disabled === true));
		console.log('Filtered disabled rewards:', rewardData);

		rewardData = await filterCompletedRewards(uid, rewardData);
		if (!rewardData || !rewardData.length) {
			console.log('No eligible rewards left after filtering completed rewards.');
			return;
		}

		const eligible = await Promise.all(rewardData.map(reward => checkCondition(reward, method)));
		const eligibleRewards = rewardData.filter((reward, index) => eligible[index]);

		if (eligibleRewards.length > 0) {
			await giveRewards(uid, eligibleRewards);
		}
	},
};

promisify(rewards);

export = rewards;
