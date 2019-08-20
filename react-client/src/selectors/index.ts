import { AppState } from '../store'

export const osmUserId = (state: AppState) => {
    return state.osmLogin.userId;
}

export const sessionId = (state: AppState) => {
    return state.session.sessionId;
}
