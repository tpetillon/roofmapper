import { Reducer } from 'redux';
import { produce } from 'immer';
import {
    MapAction,
    MOVE_TO,
    OsmLoginAction,
    SET_OSM_LOGIN_STATUS, SET_OSM_USER_DETAILS,
    SessionAction,
    SET_SESSION_DETAILS, SET_SESSION_STATUS, ADD_BUILDING, SET_BUILDING_INDEX, SELECT_LAST_BUILDING,
} from "../actions";
import { Coordinates } from '../Coordinates';
import { Building } from './Building';

export interface MapState {
    position: Coordinates;
    zoomLevel: number;
}

export const initialMapState: MapState = {
    position: new Coordinates(-4, 48),
    zoomLevel: 7
};

export const mapReducer: Reducer<MapState, MapAction> = (state = initialMapState, action) => {
    return produce(state, draft => {
        switch (action.type) {
            case MOVE_TO:
                draft.position = action.position;
                draft.zoomLevel = action.zoomLevel;
                break;
        }
    });
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
    return produce(state, draft => {
        switch (action.type) {
            case SET_OSM_LOGIN_STATUS:
                if (action.status === OsmLoginStatus.LoggedIn) {
                    console.error('Cannot set OSM login status to logged-in without details');
                } else {
                    draft.status = action.status;
                    draft.username = undefined;
                    draft.userId = undefined;
                }
                break;
            case SET_OSM_USER_DETAILS:
                draft.status = OsmLoginStatus.LoggedIn;
                draft.username = action.username;
                draft.userId = action.userId;
                break;
        }
    });
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
    buildings: Building[];
    currentBuildingIndex: number;
}

export const initialSessionState: SessionState = {
    status: SessionStatus.NoSession,
    sessionId: undefined,
    buildings: [],
    currentBuildingIndex: -1
}

export const sessionReducer: Reducer<SessionState, SessionAction> = (state = initialSessionState, action) => {
    return produce(state, draft => {
        switch (action.type) {
            case SET_SESSION_STATUS:
                if (action.status === SessionStatus.Created) {
                    console.error('Cannot set session status to created without details');
                } else {
                    draft.status = action.status;
                    draft.sessionId = undefined;
                }
                break;
            case SET_SESSION_DETAILS:
                draft.status = SessionStatus.Created;
                draft.sessionId = action.sessionId;
                break;
            case ADD_BUILDING:
                draft.buildings.push(action.building);
                break;
            case SET_BUILDING_INDEX:
                if ((state.buildings.length === 0 && action.index !== -1) ||
                    (state.buildings.length > 0 && (action.index < 0 || action.index >= state.buildings.length))) {
                    console.error('Invalid building index', action.index);
                } else {
                    draft.currentBuildingIndex = action.index;
                }
                break;
            case SELECT_LAST_BUILDING:
                draft.currentBuildingIndex = state.buildings.length - 1;
                break;
        }
    });
}
