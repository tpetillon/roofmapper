import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { LatLng, Polygon as LPolygon, LatLngBounds } from 'leaflet';
import { Map, TileLayer, Marker, Popup, Viewport, Polygon } from 'react-leaflet';

import * as actions from '../actions';
import { AppState } from '../reducers';
import { Point } from '../reducers/Point';
import { Bounds } from '../reducers/Bounds';
import { Multipolygon } from '../reducers/Polygon';

function coordPairToPoint(position: [number, number] | null | undefined): Point {
    if (position)
    {
        return { longitude: position[1], latitude: position[0] };
    }

    return { longitude: 0, latitude: 0 };
}

function pointToLatLng(point: Point) {
    return new LatLng(point.latitude, point.longitude);
}

function boundsToLatLngBounds(bounds: Bounds) {
    return new LatLngBounds(
        pointToLatLng(bounds.min),
        pointToLatLng(bounds.max));
}

function toPolygon(multipolygon: Multipolygon): LPolygon {
    let polygons = new Array<Array<Array<LatLng>>>();
    for (let outer of multipolygon.outers) {
        polygons.push([outer.points.map(point => pointToLatLng(point))].concat(
            multipolygon.inners.map(inner => inner.points.map(point => pointToLatLng(point)))));
    }
    return new LPolygon(polygons);
}

interface Props {
    position: LatLng;
    zoom: number;
    bounds: LatLngBounds | undefined;
    buildingPolygon: LPolygon | undefined;
    onViewportChanged?: (viewport: Viewport) => void;
}

class MapComponent extends React.Component<Props, object> {
    render() {
        const longitude = this.props.position.lng;
        const latitude = this.props.position.lat;
        const zoom = this.props.zoom;
        const viewport: Viewport | undefined = this.props.bounds ? undefined : {
            center: [latitude, longitude],
            zoom: zoom
        };

        const polygon = this.props.buildingPolygon ?
            <Polygon positions={this.props.buildingPolygon.getLatLngs()}></Polygon> : undefined;

        return (
            <div className="map-container">
                <div className="position-display">
                    The map is at {longitude}, {latitude}. Zoom {zoom}.
                </div>
                <Map id="map"
                    maxZoom={19}
                    viewport={viewport}
                    bounds={this.props.bounds}
                    onViewportChanged={this.props.onViewportChanged}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={this.props.position}>
                        <Popup>
                            A pretty CSS3 popup. <br /> Easily customizable.
                        </Popup>
                    </Marker>
                    {polygon}
                </Map>
            </div>
          );
    }
}

export function mapStateToProps(state: AppState): Props {
    const bounds = state.map.bounds ? boundsToLatLngBounds(state.map.bounds) : undefined;

    const building = state.session.buildings[state.work.currentBuildingIndex];
    const polygon = building ? building.polygon : undefined;
    const leafletPolygon = polygon ? toPolygon(polygon) : undefined;

    return {
        position: pointToLatLng(state.map.position),
        zoom: state.map.zoomLevel,
        bounds: bounds,
        buildingPolygon: leafletPolygon
    };
}

export function mapDispatchToProps(dispatch: Dispatch<actions.MapAction>) {
    return {
        onViewportChanged: (viewport: Viewport) => {
            const position = coordPairToPoint(viewport.center);
            const zoom = viewport.zoom ? viewport.zoom : 0;
            dispatch(actions.moveTo(position, zoom));
        },
    }
}

export const MapContainer = connect(mapStateToProps, mapDispatchToProps)(MapComponent);
