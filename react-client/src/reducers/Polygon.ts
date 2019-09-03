import { Point } from "./Point";
import { Bounds, newBounds, extendBounds, mergeBounds } from "./Bounds";

export interface Polygon {
    points: Point[]
}

export interface Multipolygon {
    outers: Polygon[],
    inners: Polygon[]
}

export function computePolygonBounds(polygon: Polygon): Bounds {
    if (polygon.points.length === 0) {
        throw new Error('Polygon must not be empty');
    }

    let bounds = newBounds(polygon.points[0]);

    for (let i = 1; i < polygon.points.length; i++) {
        extendBounds(bounds, polygon.points[i]);
    }

    return bounds;
}

export function computeMultipolygonBounds(multipolygon: Multipolygon): Bounds {
    const bounds = multipolygon.outers.reduce((accumulator: Bounds | undefined, currentPolygon: Polygon) => {
        const currentBounds = computePolygonBounds(currentPolygon);
        if (!accumulator) {
            return currentBounds;
        } else {
            return mergeBounds(accumulator, currentBounds);
        }
    }, undefined);

    if (!bounds) {
        throw new Error('Multipolygon outers must not be empty');
    }

    return bounds;
}
