import { Reducer } from 'redux';
import {
    MapAction,
    MOVE_TO,
    OsmLoginAction,
    SET_OSM_LOGIN_STATUS, SET_OSM_USER_DETAILS,
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
            const username = action.status == OsmLoginStatus.LoggedOut ? undefined : state.username;
            const userId = action.status == OsmLoginStatus.LoggedOut ? undefined : state.userId;
            return { ...state, status: action.status, username: username, userId: userId };
        case SET_OSM_USER_DETAILS:
            return { ...state, username: action.username, userId: action.userId };
    }

    return state;
}
