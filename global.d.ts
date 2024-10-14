declare namespace NodeJS {
    interface Process {
        elapsedTimeSince(start: [number, number]): number;
        profile(operation: string, start: [number, number]): void;
    }
}
