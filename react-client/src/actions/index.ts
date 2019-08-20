import { Coordinates } from '../Coordinates';
import { OsmLoginStatus, SessionStatus } from '../reducers';

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

export type SessionAction =
    SetSessionStatusAction |
    SetSessionDetailsAction;
