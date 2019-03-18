import { Coordinates } from '../Coordinates';
import { OsmConnectionStatus } from '../reducers';

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

export const SET_OSM_CONNECTION_STATUS = 'SET_OSM_CONNECTION_STATUS';
export type SET_OSM_CONNECTION_STATUS = typeof SET_OSM_CONNECTION_STATUS;

export interface SetOsmConnectionStatusAction {
    type: SET_OSM_CONNECTION_STATUS;
    status: OsmConnectionStatus;
}

export function setOsmConnectionStatus(status: OsmConnectionStatus) {
    return {
        type: SET_OSM_CONNECTION_STATUS,
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

export const REQUEST_OSM_CONNECTION = 'REQUEST_OSM_CONNECTION';
export type REQUEST_OSM_CONNECTION = typeof REQUEST_OSM_CONNECTION;

export interface RequestOsmConnectionAction {
    type: REQUEST_OSM_CONNECTION
}

export function requestOsmConnection(): RequestOsmConnectionAction {
    return {
        type: REQUEST_OSM_CONNECTION
    }
}

export const REQUEST_OSM_DISCONNECTION = 'REQUEST_OSM_DISCONNECTION';
export type REQUEST_OSM_DISCONNECTION = typeof REQUEST_OSM_DISCONNECTION;

export interface RequestOsmDisconnectionAction {
    type: REQUEST_OSM_DISCONNECTION
}

export function requestOsmDisconnection(): RequestOsmDisconnectionAction {
    return {
        type: REQUEST_OSM_DISCONNECTION
    }
}

export type OsmConnectionAction =
    RequestOsmConnectionAction |
    RequestOsmDisconnectionAction |
    SetOsmConnectionStatusAction |
    SetOsmUserDetailsAction;
