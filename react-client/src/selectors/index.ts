import { AppState } from '../store'

export const osmUserId = (state: AppState) => {
    return state.osmLogin.userId;
}

export const sessionId = (state: AppState) => {
    return state.session.sessionId;
}

export const currentBuildingPosition = (state: AppState) => {
    const building = state.session.buildings[state.session.currentBuildingIndex];
    return building ? building.position : undefined;
}
