export interface IPost {
    pid: number,
    uid: number,
    tid: number,
    timestamp: number,
    deleted: boolean,
    upvotes: number,
    downvotes: number,
    category: any,
    topic: ITopic,
    user: {
        username?: string,
    },
}

export interface ITopic {
    postcount?: string,
    deleted?: boolean,
    category?: any,
    tags?: ITag[] | string[],
    cid?: number
}

export interface ITag {
    value?: string
}