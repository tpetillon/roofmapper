import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { LatLng } from 'leaflet';
import { Map, TileLayer, Marker, Popup, Viewport, Polygon } from 'react-leaflet';

import { Coordinates } from '../Coordinates';
import * as actions from '../actions';
import { AppState } from '../store';

function toCoordinates(position: [number, number] | null | undefined) {
    if (position)
    {
        return new Coordinates(position[1], position[0]);
    }

    return new Coordinates(0, 0);
}

function toLatLng(position: Coordinates) {
    return new LatLng(position.latitude, position.longitude);
}

interface Props {
    position: Coordinates;
    zoom: number;
    buildingPolygon: Array<Array<Array<LatLng>>> | undefined;
    onViewportChanged?: (viewport: Viewport) => void;
}

class MapComponent extends React.Component<Props, object> {
    render() {
        const longitude = this.props.position.longitude;
        const latitude = this.props.position.latitude;
        const zoom = this.props.zoom;
        const viewport: Viewport = {
            center: [latitude, longitude],
            zoom: zoom
        };

        const polygon = this.props.buildingPolygon ?
            <Polygon positions={this.props.buildingPolygon}></Polygon>
            :
            undefined;

        return (
            <div className="map-container">
                <div className="position-display">
                    The map is at {longitude}, {latitude}. Zoom {zoom}.
                </div>
                <Map id="map" viewport={viewport} onViewportChanged={this.props.onViewportChanged} maxZoom={19}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={toLatLng(this.props.position)}>
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
    const building = state.session.buildings[state.session.currentBuildingIndex];
    const polygon = building ? building.polygon : undefined;

    return {
        position: state.map.position,
        zoom: state.map.zoomLevel,
        buildingPolygon: polygon
    };
}

export function mapDispatchToProps(dispatch: Dispatch<actions.MapAction>) {
    return {
        onViewportChanged: (viewport: Viewport) => {
            const position = toCoordinates(viewport.center);
            const zoom = viewport.zoom ? viewport.zoom : 0;
            dispatch(actions.moveTo(position, zoom));
        },
    }
}

export const MapContainer = connect(mapStateToProps, mapDispatchToProps)(MapComponent);
