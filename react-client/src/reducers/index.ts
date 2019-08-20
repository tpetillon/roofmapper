import { Reducer } from 'redux';
import {
    MapAction,
    MOVE_TO,
    OsmLoginAction,
    SET_OSM_LOGIN_STATUS, SET_OSM_USER_DETAILS,
    SessionAction,
    SET_SESSION_DETAILS, SET_SESSION_STATUS,
} from "../actions";
import { Coordinates } from '../Coordinates';

export interface MapState {
    position: Coordinates;
    zoomLevel: number;
}

export const initialMapState: MapState = {
    position: new Coordinates(48, -4),
    zoomLevel: 7
};

export const mapReducer: Reducer<MapState, MapAction> = (state = initialMapState, action) => {
    switch (action.type) {
        case MOVE_TO:
            return { ...state, position: action.position, zoomLevel: action.zoomLevel };
    }

    return state;
}

export enum OsmLoginStatus {
    LoggedOut,
    LoggingIn,
    FetchingDetails,
    LoggedIn,
    Error
}

export interface OsmLoginState {
    status: OsmLoginStatus;
    username: string | undefined;
    userId: string | undefined;
}

export const initialOsmLoginState: OsmLoginState = {
    status: OsmLoginStatus.LoggedOut,
    username: undefined,
    userId: undefined
}

export const osmLoginReducer: Reducer<OsmLoginState, OsmLoginAction> = (state = initialOsmLoginState, action) => {
    switch (action.type) {
        case SET_OSM_LOGIN_STATUS:
            if (action.status == OsmLoginStatus.LoggedIn) {
                console.error("Cannot set OSM login status to logged-in without details")
            } else {
                return { ...state, status: action.status, username: undefined, userId: undefined };
            }
            break;
        case SET_OSM_USER_DETAILS:
            return { ...state, status: OsmLoginStatus.LoggedIn, username: action.username, userId: action.userId };
    }

    return state;
}

export enum SessionStatus {
    NoSession,
    Creating,
    Created,
    Error
}

export interface SessionState {
    status: SessionStatus;
    sessionId: string | undefined;
}

export const initialSessionState: SessionState = {
    status: SessionStatus.NoSession,
    sessionId: undefined
}

export const sessionReducer: Reducer<SessionState, SessionAction> = (state = initialSessionState, action) => {
    switch (action.type) {
        case SET_SESSION_STATUS:
            if (action.status == SessionStatus.Created) {
                console.error("Cannot set session status to created without details")
            } else {
                return { ...state, status: action.status, sessionId: undefined };
            }
            break;
        case SET_SESSION_DETAILS:
            return { ...state, status: SessionStatus.Created, sessionId: action.sessionId };
    }

    return state;
}
