import { createReducer } from 'typesafe-actions';
import { produce } from 'immer';
import * as actions from '../actions';
import { Point } from './Point';
import { Bounds } from './Bounds';
import { getBuildingBounds } from './Building';
import { SessionStatus, Session, newSession } from './Session';
import { ImageryLayer, getSourceString } from './ImageryLayer';

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

export interface WorkState {
    imageryLayer: ImageryLayer;
    currentBuildingIndex: number;
    waitingForNewBuilding: boolean;
}

export const initialWorkState: WorkState = {
    imageryLayer: ImageryLayer.OpenStreetMap,
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
    session: Session;
    work: WorkState;
    map: MapState;
}

export const initialAppState: AppState = {
    osmLogin: initialOsmLoginState,
    session: newSession(),
    work: initialWorkState,
    map: initialMapState
};

function checkForBuildingIndex(session: Session, buildingIndex: number) {
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
            draft.work.waitingForNewBuilding = true;
        }))
    .handleAction(actions.addBuilding, (state, action) => produce(state, draft => {
            draft.session.buildings.push(action.payload.building);
            if (state.work.waitingForNewBuilding) {
                draft.work.waitingForNewBuilding = false;
                draft.work.currentBuildingIndex = draft.session.buildings.length - 1;
            }
        }))
    .handleAction(actions.setBuildingIndex, (state, action) => produce(state, draft => {
            if (checkForBuildingIndex(state.session, action.payload.buildingIndex)) {
                draft.work.currentBuildingIndex = action.payload.buildingIndex;
            }
        }))
    .handleAction(actions.selectLastBuilding, (state, action) => produce(state, draft => {
            draft.work.currentBuildingIndex = state.session.buildings.length - 1;
        }))
    .handleAction(actions.setCurrentBuildingRoofMaterial, (state, action) => produce(state, draft => {
            const building = draft.session.buildings[state.work.currentBuildingIndex];
            if (building) {
                const previousRoofMaterial = building.roofMaterial;
                const previousInvalidityReason = building.invalidityReason;

                building.roofMaterial = action.payload.roofMaterial;
                building.invalidityReason = undefined;

                if (action.payload.roofMaterial && !previousRoofMaterial) {
                    draft.session.taggedBuildingCount += 1;
                }
                if (!action.payload.roofMaterial && previousRoofMaterial) {
                    draft.session.taggedBuildingCount -= 1;
                }

                if (previousInvalidityReason) {
                    draft.session.invalidatedBuildingCount -= 1;
                }
            }
        }))
    .handleAction(actions.setChangesetId, (state, action) => produce(state, draft => {
            if (state.session.changesetId) {
                console.warn('A changeset is already set');
            }
            draft.session.changesetId = action.payload.changesetId;
        }))
    .handleAction(actions.clearTaggedBuildings, (state, action) => produce(state, draft => {
            let i = draft.session.buildings.length;
            while (i--) {
                const building = draft.session.buildings[i];
                if (building.roofMaterial) {
                    draft.session.buildings.splice(i, 1);
                    if (draft.work.currentBuildingIndex > i) {
                        draft.work.currentBuildingIndex -= 1;
                    }
                }
            }
            if (draft.work.currentBuildingIndex >= draft.session.buildings.length) {
                draft.work.currentBuildingIndex = -1;
            }
        }))
    .handleAction(actions.addUploadedBuildingCount, (state, action) => produce(state, draft => {
            draft.work.currentBuildingIndex += action.payload.taggedBuildingCount;
        }));

export const mapReducer = createReducer<AppState, actions.RootAction>(initialAppState)
    .handleAction(actions.moveTo, (state, action) => produce(state, draft => {
            draft.map.position = action.payload.position;
            draft.map.zoomLevel = action.payload.zoomLevel;
            draft.map.bounds = undefined;
        }))
    .handleAction(actions.selectImageryLayer, (state, action) => produce(state, draft => {
            draft.work.imageryLayer = action.payload.imageryLayer;
            
            const source = getSourceString(action.payload.imageryLayer);
            if (source && !state.session.sources.includes(source)) {
                draft.session.sources.push(source);
            }
        }))
    .handleAction(actions.setBuildingIndex, (state, action) => produce(state, draft => {
            if (state.work.currentBuildingIndex !== -1) {
                draft.map.bounds = getBuildingBounds(state.session.buildings[state.work.currentBuildingIndex]);
            }
        }))
    .handleAction(actions.selectLastBuilding, (state, action) => produce(state, draft => {
            // @Todo Deduplicate
            if (state.work.currentBuildingIndex !== -1) {
                draft.map.bounds = getBuildingBounds(state.session.buildings[state.work.currentBuildingIndex]);
            }
        }));
