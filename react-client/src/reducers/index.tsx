import { Reducer } from 'redux';
import { MapAction, MOVE_TO } from "../actions";
import { Coordinates } from '../Coordinates';

export interface MapState {
    position: Coordinates,
    zoomLevel: number
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
