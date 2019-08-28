import { Reducer } from 'redux';
import { createReducer } from 'typesafe-actions';
import { produce } from 'immer';
import * as actions from '../actions';
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

export const mapReducer = createReducer<MapState, actions.MapAction>(initialMapState)
    .handleAction(actions.moveTo, (state, action) => produce(state, draft => {
            draft.position = action.payload.position;
            draft.zoomLevel = action.payload.zoomLevel;
        }));

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

export const osmLoginReducer = createReducer<OsmLoginState, actions.OsmLoginAction>(initialOsmLoginState)
    .handleAction(actions.setOsmLoginStatus, (state, action) => produce(state, draft => {
            if (action.payload.status === OsmLoginStatus.LoggedIn) {
                console.error('Cannot set OSM login status to logged-in without details');
            } else {
                draft.status = action.payload.status;
                draft.username = undefined;
                draft.userId = undefined;
            }
        }))
    .handleAction(actions.setOsmUserDetails, (state, action) => produce(state, draft => {
            draft.status = OsmLoginStatus.LoggedIn;
            draft.username = action.payload.username;
            draft.userId = action.payload.userId;
        }));

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

export const sessionReducer = createReducer<SessionState, actions.SessionAction>(initialSessionState)
    .handleAction(actions.setSessionStatus, (state, action) => produce(state, draft => {
            if (action.payload.status === SessionStatus.Created) {
                console.error('Cannot set session status to created without details');
            } else {
                draft.status = action.payload.status;
                draft.sessionId = undefined;
            }
        }))
    .handleAction(actions.setSessionDetails, (state, action) => produce(state, draft => {
                draft.status = SessionStatus.Created;
                draft.sessionId = action.payload.sessionId;
        }))
    .handleAction(actions.addBuilding, (state, action) => produce(state, draft => {
            draft.buildings.push(action.payload.building);
        }))
    .handleAction(actions.setBuildingIndex, (state, action) => produce(state, draft => {
            if ((state.buildings.length === 0 && action.payload.index !== -1) ||
                (state.buildings.length > 0 && (action.payload.index < 0 || action.payload.index >= state.buildings.length))) {
                console.error('Invalid building index', action.payload.index);
            } else {
                draft.currentBuildingIndex = action.payload.index;
            }
        }))
    .handleAction(actions.selectLastBuilding, (state, action) => produce(state, draft => {
        draft.currentBuildingIndex = state.buildings.length - 1;
        }));
