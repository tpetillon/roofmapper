import { Reducer } from 'redux';
import {
    MapAction,
    MOVE_TO,
    OsmConnectionAction,
    SET_OSM_CONNECTION_STATUS, SET_OSM_USER_DETAILS, REQUEST_OSM_CONNECTION, REQUEST_OSM_DISCONNECTION
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

export enum OsmConnectionStatus {
    Disconnected,
    Connecting,
    Connected
}

export interface OsmConnectionState {
    status: OsmConnectionStatus;
    username: string;
}

export const initialOsmConnectionState: OsmConnectionState = {
    status: OsmConnectionStatus.Disconnected,
    username: ''
}

export const osmConnectionReducer: Reducer<OsmConnectionState, OsmConnectionAction> = (state = initialOsmConnectionState, action) => {
    switch (action.type) {
        case SET_OSM_CONNECTION_STATUS:
            const username = action.status == OsmConnectionStatus.Disconnected ? '' : state.username;
            return { ...state, status: action.status, username: username };
        case SET_OSM_USER_DETAILS:
            return { ...state, username: action.username };
    }

    return state;
}
