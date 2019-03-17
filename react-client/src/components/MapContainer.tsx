import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { LatLng } from 'leaflet';
import { Map, TileLayer, Marker, Popup, Viewport } from 'react-leaflet';

import { Coordinates } from '../Coordinates';
import * as actions from '../actions';
import { AppState } from '../store';

function toCoordinates(position: [number, number] | null | undefined) {
    if (position)
    {
        return new Coordinates(position[0], position[1]);
    }

    return new Coordinates(0, 0);
}

function toLatLng(position: Coordinates) {
    return new LatLng(position.longitude, position.latitude);
}

interface Props {
    position: Coordinates;
    zoom: number;
    onViewportChanged?: (viewport: Viewport) => void;
}

class MapContainer extends React.Component<Props, object> {
    render() {
        const longitude = this.props.position.longitude;
        const latitude = this.props.position.latitude;
        const zoom = this.props.zoom;
        const viewport: Viewport = {
            center: [longitude, latitude],
            zoom: zoom
        };

        return (
            <div className="map-container">
                <div className="position-display">
                    The map is at {longitude}, {latitude}. Zoom {zoom}.
                </div>
                <Map id="map" viewport={viewport} onViewportChanged={this.props.onViewportChanged}>
                    <TileLayer
                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={toLatLng(this.props.position)}>
                        <Popup>
                            A pretty CSS3 popup. <br /> Easily customizable.
                        </Popup>
                    </Marker>
                </Map>
            </div>
          );
    }
}

export function mapStateToProps(state: AppState): Props {
    return {
        position: state.map.position,
        zoom: state.map.zoomLevel
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

export default connect(mapStateToProps, mapDispatchToProps)(MapContainer);
