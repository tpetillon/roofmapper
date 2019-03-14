import { Coordinates } from '../Coordinates';

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
