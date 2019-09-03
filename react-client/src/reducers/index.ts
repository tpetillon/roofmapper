import { createReducer } from 'typesafe-actions';
import { produce } from 'immer';
import * as actions from '../actions';
import { Point } from './Point';
import { Bounds } from './Bounds';
import { Building, getBuildingBounds } from './Building';

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
};

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
    waitingForNewBuilding: boolean;
}

export const initialSessionState: SessionState = {
    status: SessionStatus.NoSession,
    sessionId: undefined,
    buildings: [],
    currentBuildingIndex: -1,
    waitingForNewBuilding: false
};

export interface MapState {
    position: Point;
    zoomLevel: number;
    bounds: Bounds | undefined
}

export const initialMapState: MapState = {
    position: { longitude: -4, latitude: 48 },
    zoomLevel: 7,
    bounds: undefined
};

export interface AppState {
    osmLogin: OsmLoginState;
    session: SessionState;
    map: MapState;
}

export const initialAppState: AppState = {
    osmLogin: initialOsmLoginState,
    session: initialSessionState,
    map: initialMapState
};

function checkForBuildingIndex(session: SessionState, buildingIndex: number) {
    if (!Number.isInteger(buildingIndex) ||
        (session.buildings.length === 0 && buildingIndex !== -1) ||
        (session.buildings.length > 0 &&
        (buildingIndex < 0 || buildingIndex >= session.buildings.length))) {
        console.error('Invalid building index', buildingIndex);
        return false;
    }

    return true;
}

export const osmLoginReducer = createReducer<AppState, actions.RootAction>(initialAppState)
    .handleAction(actions.setOsmLoginStatus, (state, action) => produce(state, draft => {
            if (action.payload.status === OsmLoginStatus.LoggedIn) {
                console.error('Cannot set OSM login status to logged-in without details');
            } else {
                draft.osmLogin.status = action.payload.status;
                draft.osmLogin.username = undefined;
                draft.osmLogin.userId = undefined;
            }
        }))
    .handleAction(actions.setOsmUserDetails, (state, action) => produce(state, draft => {
            draft.osmLogin.status = OsmLoginStatus.LoggedIn;
            draft.osmLogin.username = action.payload.username;
            draft.osmLogin.userId = action.payload.userId;
        }));

export const sessionReducer = createReducer<AppState, actions.RootAction>(initialAppState)
    .handleAction(actions.setSessionStatus, (state, action) => produce(state, draft => {
            if (action.payload.status === SessionStatus.Created) {
                console.error('Cannot set session status to created without details');
            } else {
                draft.session.status = action.payload.status;
                draft.session.sessionId = undefined;
            }
        }))
    .handleAction(actions.setSessionDetails, (state, action) => produce(state, draft => {
            draft.session.status = SessionStatus.Created;
            draft.session.sessionId = action.payload.sessionId;
        }))
    .handleAction(actions.requestBuilding, (state, action) => produce(state, draft => {
            draft.session.waitingForNewBuilding = true;
        }))
    .handleAction(actions.addBuilding, (state, action) => produce(state, draft => {
            draft.session.buildings.push(action.payload.building);
            if (state.session.waitingForNewBuilding) {
                draft.session.waitingForNewBuilding = false;
                draft.session.currentBuildingIndex = draft.session.buildings.length - 1;
            }
        }))
    .handleAction(actions.setBuildingIndex, (state, action) => produce(state, draft => {
            if (checkForBuildingIndex(state.session, action.payload.buildingIndex)) {
                draft.session.currentBuildingIndex = action.payload.buildingIndex;
            }
        }))
    .handleAction(actions.selectLastBuilding, (state, action) => produce(state, draft => {
            draft.session.currentBuildingIndex = state.session.buildings.length - 1;
        }))
    .handleAction(actions.setCurrentBuildingRoofMaterial, (state, action) => produce(state, draft => {
            const building = draft.session.buildings[state.session.currentBuildingIndex];
            if (building) {
                building.roofMaterial = action.payload.roofMaterial;
                building.invalidityReason = undefined;
            }
        }));

export const mapReducer = createReducer<AppState, actions.RootAction>(initialAppState)
    .handleAction(actions.moveTo, (state, action) => produce(state, draft => {
            draft.map.position = action.payload.position;
            draft.map.zoomLevel = action.payload.zoomLevel;
            draft.map.bounds = undefined;
        }))
    .handleAction(actions.setBuildingIndex, (state, action) => produce(state, draft => {
            if (state.session.currentBuildingIndex !== -1) {
                draft.map.bounds = getBuildingBounds(state.session.buildings[state.session.currentBuildingIndex]);
            }
        }))
    .handleAction(actions.selectLastBuilding, (state, action) => produce(state, draft => {
            // @Todo Deduplicate
            if (state.session.currentBuildingIndex !== -1) {
                draft.map.bounds = getBuildingBounds(state.session.buildings[state.session.currentBuildingIndex]);
            }
        }));
