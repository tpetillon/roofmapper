import { Building } from "./Building";

export enum SessionStatus {
    NoSession,
    Creating,
    Created,
    Error
}

export interface Session {
    status: SessionStatus;
    sessionId: string | undefined;
    buildings: Building[];
    taggedBuildingCount: number;
    invalidatedBuildingCount: number;
    uploadedBuildingCount: number;
    changesetId: number | undefined;
    sources: string[];
}

export function newSession(): Session {
    return {
        status: SessionStatus.NoSession,
        sessionId: undefined,
        buildings: [],
        taggedBuildingCount: 0,
        invalidatedBuildingCount: 0,
        uploadedBuildingCount: 0,
        changesetId: undefined,
        sources: []
    };
}
