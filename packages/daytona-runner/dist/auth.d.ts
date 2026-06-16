export interface DaytonaAuthCredentials {
    apiKey?: string;
    jwtToken?: string;
    organizationId?: string;
}
export type ResolvedDaytonaAuthCredentials = {
    apiKey: string;
} | {
    jwtToken: string;
    organizationId: string;
};
export declare function resolveDaytonaAuthCredentials(credentials: DaytonaAuthCredentials): ResolvedDaytonaAuthCredentials;
export declare function applyDaytonaAuthEnv(env: Record<string, string>, credentials: DaytonaAuthCredentials): void;
