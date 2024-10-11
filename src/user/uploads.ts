import path from 'path';
import nconf from 'nconf';
import winston from 'winston';
import crypto from 'crypto';

import db from '../database';
import posts from '../posts';
import file from '../file';
import batch from '../batch';

const md5 = (filename: string): string => crypto.createHash('md5').update(filename).digest('hex');
const _getFullPath = (relativePath: string): string => path.resolve(nconf.get('upload_path'), relativePath);
const _validatePath = async (relativePaths: string | string[]): Promise<void> => {
    if (typeof relativePaths === 'string') {
        relativePaths = [relativePaths];
    } else if (!Array.isArray(relativePaths)) {
        throw new Error(`[[error:wrong-parameter-type, relativePaths, ${typeof relativePaths}, array]]`);
    }

    const fullPaths = relativePaths.map(path => _getFullPath(path));
    const exists = await Promise.all(fullPaths.map(async (fullPath) => file.exists(fullPath)));

    if (!fullPaths.every(fullPath => fullPath.startsWith(nconf.get('upload_path'))) || !exists.every(Boolean)) {
        throw new Error('[[error:invalid-path]]');
    }
};

export default function (User: any) {

    User.associateUpload = async (uid: number, relativePath: string): Promise<void> => {
        await _validatePath(relativePath);
        await Promise.all([
            db.sortedSetAdd(`uid:${uid}:uploads`, Date.now(), relativePath),
            db.setObjectField(`upload:${md5(relativePath)}`, 'uid', uid),
        ]);
    };

    User.deleteUpload = async function (callerUid: number, uid: number, uploadNames: string | string[]): Promise<void> {
        if (typeof uploadNames === 'string') {
            uploadNames = [uploadNames];
        } else if (!Array.isArray(uploadNames)) {
            throw new Error(`[[error:wrong-parameter-type, uploadNames, ${typeof uploadNames}, array]]`);
        }

        await _validatePath(uploadNames);

        const [isUsersUpload, isAdminOrGlobalMod] = await Promise.all([
            db.isSortedSetMembers(`uid:${callerUid}:uploads`, uploadNames),
            User.isAdminOrGlobalMod(callerUid),
        ]);

        if (!isAdminOrGlobalMod && !isUsersUpload.every(Boolean)) {
            throw new Error('[[error:no-privileges]]');
        }

        await batch.processArray(uploadNames, async (uploadNames: string[]) => {
            const fullPaths = uploadNames.map(path => _getFullPath(path));

            await Promise.all(fullPaths.map(async (fullPath, idx) => {
                winston.verbose(`[user/deleteUpload] Deleting ${uploadNames[idx]}`);
                await Promise.all([
                    file.delete(fullPath),
                    file.delete(file.appendToFileName(fullPath, '-resized')),
                ]);
                await Promise.all([
                    db.sortedSetRemove(`uid:${uid}:uploads`, uploadNames[idx]),
                    db.delete(`upload:${md5(uploadNames[idx])}`),
                ]);
            }));

			// Dissociate the upload from pids, if any
			const pids = await db.getSortedSetsMembers(uploadNames.map(relativePath => `upload:${md5(relativePath)}:pids`));
            await Promise.all(pids.map(async (pids, idx) => 
                Promise.all(pids.map(async (pid) => posts.uploads.dissociate(pid, uploadNames[idx])))));
        }, { batch: 50 });
    };

    User.collateUploads = async function (uid: number, archive: any): Promise<void> {
        await batch.processSortedSet(`uid:${uid}:uploads`, (files: string[], next: Function) => {
            files.forEach((file: string) => {
                archive.file(_getFullPath(file), {
                    name: path.basename(file),
                });
            });
            setImmediate(() => next());
        }, { batch: 100 });
    };
};