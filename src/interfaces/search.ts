export interface ISearchData {
    query: string,
    searchIn: string,
    uid?: number;
    hasTags?: string,
    categories?: string[],
    searchChildren?: boolean,
    sortBy?: string,
    sortDirection?: string,
    matchWords?: string,
    returnIds?: number[],
    itemsPerPage?: number,
    page?: number,
    replies?: string,
    timeRange?: string,
    repliesFilter?: string,
    timeFilter?: string,
    postedBy?: string
}