import _ = require('lodash');
import meta = require('../meta');
import db = require('../database');
import plugins = require('../plugins');
import user = require('../user');
import topics = require('../topics');
import categories = require('../categories');
import groups = require('../groups');
import privileges = require('../privileges');

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