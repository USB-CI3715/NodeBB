export interface IPost {
    pid: number,
    uid: number,
    tid: number,
    timestamp: number,
    deleted: boolean,
    upvotes: number,
    downvotes: number,
    category: Record<string, unknown>,
    topic: ITopic,
    user: {
        username?: string,
    },
}

export interface ITopic {
    postcount?: string,
    deleted?: boolean,
    category?: Record<string, unknown>,
    tags?: ITag[] | string[],
    cid?: number
}

export interface ITag {
    value?: string
}


