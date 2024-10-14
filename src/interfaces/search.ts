export interface ISearchData {
    query: string,
    searchIn: string,
    uid?: number;
    hasTags?: string,
    categories?: any[],
    searchChildren?: boolean,
    sortBy?: string,
    sortDirection?: string,
    matchWords?: string,
    returnIds?: number[],
    itemsPerPage?: number,
    page?: number,
    replies?: string,
    timeRange?: string,
    repliesFilter?: any,
    timeFilter?: any,
    postedBy?: string
}