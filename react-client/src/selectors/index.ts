import { AppState } from '../reducers'
import { getBuildingPosition } from '../reducers/Building';
import { sessionToOsmChange, sessionToTagData } from '../reducers/OsmChange';

export const osmUserId = (state: AppState) => {
    return state.osmLogin.userId;
}

export const sessionId = (state: AppState) => {
    return state.session.sessionId;
}

export const changesetId = (state: AppState) => {
    return state.session.changesetId;
}

export const currentBuildingIndex = (state: AppState) => {
    return state.work.currentBuildingIndex;
}

export const currentBuildingPosition = (state: AppState) => {
    const building = state.session.buildings[state.work.currentBuildingIndex];
    return building ? getBuildingPosition(building) : undefined;
}

export const sessionOsmChange = (state: AppState) => {
    return sessionToOsmChange(state.session);
}

export const sessionTagData = (state: AppState) => {
    return sessionToTagData(state.session);
}
