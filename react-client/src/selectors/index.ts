import { AppState } from '../reducers'
import { getBuildingPosition } from '../reducers/Building';

export const osmUserId = (state: AppState) => {
    return state.osmLogin.userId;
}

export const sessionId = (state: AppState) => {
    return state.session.sessionId;
}

export const currentBuildingPosition = (state: AppState) => {
    const building = state.session.buildings[state.work.currentBuildingIndex];
    return building ? getBuildingPosition(building) : undefined;
}
