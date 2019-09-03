import { Point } from "./Point";

export interface Bounds {
    min: Point,
    max: Point
}

export function newBounds(point: Point): Bounds {
    return {
        min: point,
        max: point
    }
}

export function extendBounds(bounds: Bounds, point: Point): Bounds {
    return {
        min: {
            longitude: Math.min(bounds.min.longitude, point.longitude),
            latitude: Math.min(bounds.min.latitude, point.latitude)
        },
        max: {
            longitude: Math.min(bounds.max.longitude, point.longitude),
            latitude: Math.min(bounds.max.latitude, point.latitude)
        },
    }
}

export function mergeBounds(left: Bounds, right: Bounds): Bounds {
    return {
        min: {
            longitude: Math.min(left.min.longitude, right.min.longitude),
            latitude: Math.min(left.min.latitude, right.max.latitude)
        },
        max: {
            longitude: Math.min(left.max.longitude, right.min.longitude),
            latitude: Math.min(left.max.latitude, right.max.latitude)
        },
    }
}

export function getBoundsCenter(bounds: Bounds): Point {
    return {
        longitude: (bounds.max.longitude + bounds.min.longitude) / 2,
        latitude: (bounds.max.latitude + bounds.min.latitude) / 2
    }
}
