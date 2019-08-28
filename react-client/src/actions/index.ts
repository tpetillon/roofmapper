import { Coordinates } from '../Coordinates';
import { OsmLoginStatus, SessionStatus } from '../reducers';
import { Building } from '../reducers/Building';

export const MOVE_TO = 'MOVE_TO';
export type MOVE_TO = typeof MOVE_TO;

export interface MoveToAction {
    type: MOVE_TO,
    position: Coordinates,
    zoomLevel: number
}

export function moveTo(position: Coordinates, zoomLevel: number): MoveToAction {
    return {
        type: MOVE_TO,
        position: position,
        zoomLevel: zoomLevel
    }
}

export type MapAction = MoveToAction;

export const SET_OSM_LOGIN_STATUS = 'SET_OSM_LOGIN_STATUS';
export type SET_OSM_LOGIN_STATUS = typeof SET_OSM_LOGIN_STATUS;

export interface SetOsmLoginStatusAction {
    type: SET_OSM_LOGIN_STATUS;
    status: OsmLoginStatus;
}

export function setOsmLoginStatus(status: OsmLoginStatus) {
    return {
        type: SET_OSM_LOGIN_STATUS,
        status: status
    };
}

export const SET_OSM_USER_DETAILS = 'SET_OSM_USER_DETAILS';
export type SET_OSM_USER_DETAILS = typeof SET_OSM_USER_DETAILS;

export interface SetOsmUserDetailsAction {
    type: SET_OSM_USER_DETAILS;
    username: string | undefined;
    userId: string | undefined;
}

export function setOsmUserDetails(username: string | undefined, userId: string | undefined) {
    return {
        type: SET_OSM_USER_DETAILS,
        username: username,
        userId: userId
    }
}

export const REQUEST_OSM_LOGIN = 'REQUEST_OSM_LOGIN';
export type REQUEST_OSM_LOGIN = typeof REQUEST_OSM_LOGIN;

export interface RequestOsmLoginAction {
    type: REQUEST_OSM_LOGIN
}

export function requestOsmLogin(): RequestOsmLoginAction {
    return {
        type: REQUEST_OSM_LOGIN
    }
}

export const REQUEST_OSM_LOGOUT = 'REQUEST_OSM_LOGOUT';
export type REQUEST_OSM_LOGOUT = typeof REQUEST_OSM_LOGOUT;

export interface RequestOsmLogoutAction {
    type: REQUEST_OSM_LOGOUT
}

export function requestOsmLogout(): RequestOsmLogoutAction {
    return {
        type: REQUEST_OSM_LOGOUT
    }
}

export type OsmLoginAction =
    RequestOsmLoginAction |
    RequestOsmLogoutAction |
    SetOsmLoginStatusAction |
    SetOsmUserDetailsAction;

export const SET_SESSION_STATUS = 'SET_SESSION_STATUS';
export type SET_SESSION_STATUS = typeof SET_SESSION_STATUS;

export interface SetSessionStatusAction {
    type: SET_SESSION_STATUS;
    status: SessionStatus;
}

export function setSessionStatus(status: SessionStatus) {
    return {
        type: SET_SESSION_STATUS,
        status: status
    };
}

export const SET_SESSION_DETAILS = 'SET_SESSION_DETAILS';
export type SET_SESSION_DETAILS = typeof SET_SESSION_DETAILS;

export interface SetSessionDetailsAction {
    type: SET_SESSION_DETAILS;
    sessionId: string | undefined;
}

export function setSessionDetails(sessionId: string | undefined) {
    return {
        type: SET_SESSION_DETAILS,
        sessionId: sessionId
    }
}

export const ADD_BUILDING = 'ADD_BUILDING';
export type ADD_BUILDING = typeof ADD_BUILDING;

export interface AddBuildingAction {
    type: ADD_BUILDING;
    building: Building;
}

export function addBuilding(building: Building) {
    return {
        type: ADD_BUILDING,
        building: building
    }
}

export const SET_BUILDING_INDEX = 'SET_BUILDING_INDEX';
export type SET_BUILDING_INDEX = typeof SET_BUILDING_INDEX;

export interface SetBuildingIndexAction {
    type: SET_BUILDING_INDEX;
    index: number;
}

export function setBuildingIndex(index: number) {
    return {
        type: SET_BUILDING_INDEX,
        index: index
    }
}

export const SELECT_LAST_BUILDING = 'SELECT_LAST_BUILDING';
export type SELECT_LAST_BUILDING = typeof SELECT_LAST_BUILDING;

export interface SelectLastBuildingAction {
    type: SELECT_LAST_BUILDING;
}

export function selectLastBuilding() {
    return {
        type: SELECT_LAST_BUILDING
    }
}

export type SessionAction =
    SetSessionStatusAction |
    SetSessionDetailsAction | 
    AddBuildingAction |
    SetBuildingIndexAction |
    SelectLastBuildingAction;

/*export const OPEN_SESSION = 'OPEN_SESSION';
export type OPEN_SESSION = typeof OPEN_SESSION;

export interface OpenSessionAction {
    type: OPEN_SESSION
}

export function openSessionAction(): OpenSessionAction {
    return {
        type: OPEN_SESSION
    }
}

export const CLOSE_SESSION = 'CLOSE_SESSION';
export type CLOSE_SESSION = typeof CLOSE_SESSION;

export interface CloseSessionAction {
    type: CLOSE_SESSION
}

export function closeSessionAction(): CloseSessionAction {
    return {
        type: CLOSE_SESSION
    }
}*/
