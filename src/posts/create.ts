import _ from 'lodash';
import meta from '../meta';
import db from '../database';
import plugins from '../plugins';
import user from '../user';
import topics from '../topics';
import categories from '../categories';
import groups from '../groups';
import privileges from '../privileges';


interface PostData {
    uid: number;
    tid: number;
    content: string;
    timestamp?: number;
    isMain?: boolean;
    toPid?: number;
    ip?: string;
    handle?: string;
}

interface Post {
    pid: number;
    uid: number;
    tid: number;
    content: string;
    timestamp: number;
    toPid?: number;
    ip?: string;
    handle?: string;
    cid?: number;
    isMain?: boolean;
    deleted?: boolean;
}