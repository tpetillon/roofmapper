import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { LatLng, Polygon as LPolygon, LatLngBounds } from 'leaflet';
import { Map, TileLayer, Marker, Popup, Viewport, Polygon } from 'react-leaflet';

import * as actions from '../actions';
import { AppState } from '../reducers';

function toLatLng(position: [number, number] | null | undefined) {
    if (position)
    {
        return new LatLng(position[0], position[1]);
    }

    return new LatLng(0, 0);
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
    const building = state.session.buildings[state.session.currentBuildingIndex];
    const polygon = building ? building.polygon : undefined;

    return {
        position: state.map.position,
        zoom: state.map.zoomLevel,
        bounds: state.map.bounds,
        buildingPolygon: polygon
    };
}

export function mapDispatchToProps(dispatch: Dispatch<actions.MapAction>) {
    return {
        onViewportChanged: (viewport: Viewport) => {
            const position = toLatLng(viewport.center);
            const zoom = viewport.zoom ? viewport.zoom : 0;
            dispatch(actions.moveTo(position, zoom));
        },
    }
}

export const MapContainer = connect(mapStateToProps, mapDispatchToProps)(MapComponent);
