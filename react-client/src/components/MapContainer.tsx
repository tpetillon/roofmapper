import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { LatLng, Polygon as LPolygon, LatLngBounds, LayersControlEvent } from 'leaflet';
import { Map, TileLayer, Marker, Popup, Viewport, Polygon, LayersControl } from 'react-leaflet';
import { BingLayer } from 'react-leaflet-bing';

import * as actions from '../actions';
import { AppState, ImageryLayer } from '../reducers';
import { Point } from '../reducers/Point';
import { Bounds } from '../reducers/Bounds';
import { Multipolygon } from '../reducers/Polygon';

const BING_KEY = 'AlCYN3W0pAkcnVgUrS9Jb4Wkmoa_3WCGtD72BGvpzaYxAgjz0VEv5_5OalHYb3k5';

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
    selectedBaseLayer: ImageryLayer;
    buildingPolygon: LPolygon | undefined;

    onViewportChanged?: (viewport: Viewport) => void;
    onBaseLayerChanged?: (layer: ImageryLayer) => void;
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

        const polygonOverlay = this.props.buildingPolygon ?
            <LayersControl.Overlay name="Building outline" checked={true}>
                <Polygon positions={this.props.buildingPolygon.getLatLngs()}></Polygon>
            </LayersControl.Overlay> :
            undefined;

        const onBaseLayerChanged = (event: LayersControlEvent) => {
            if (!this.props.onBaseLayerChanged) {
                return;
            }

            // The only officially exploitable property in the event to
            // identify which layer has been selected is `event.layer.name`.
            // Unfortunately this is a user-facing string, which cannot
            // serve as an identifier.
            // Although it isn't in the typed properties, `zIndex` gives the
            // 1-based index of the layer in the `LayersControl`.
            // (If for some reason this breaks or is unsufficient, it is
            // possible to add custom properties on the layers and get them
            // back in `event.layer.options`.
            const index = (event.layer as any).options.zIndex as number;

            let layer: ImageryLayer;
            switch (index) {
                case 1:
                    layer = ImageryLayer.OpenStreetMap;
                    break;
                case 2:
                    layer = ImageryLayer.BingAerial;
                    break;
                default:
                    console.error('Invalid layer index:', index);
                    layer = ImageryLayer.OpenStreetMap;
                    break;
            }

            this.props.onBaseLayerChanged(layer);
        };

        return (
            <div className="map-container">
                <div className="position-display">
                    The map is at {longitude}, {latitude}. Zoom {zoom}.
                </div>
                <Map id="map"
                    maxZoom={19}
                    viewport={viewport}
                    bounds={this.props.bounds}
                    onViewportChanged={this.props.onViewportChanged}
                    onbaselayerchange={onBaseLayerChanged}>
                    <LayersControl position="topright">
                        <LayersControl.BaseLayer name="OpenStreetMap" checked={this.props.selectedBaseLayer === ImageryLayer.OpenStreetMap}>
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Bing Aerial" checked={this.props.selectedBaseLayer === ImageryLayer.BingAerial}>
                            <BingLayer
                                bingkey={BING_KEY}
                                type="Aerial"/>
                        </LayersControl.BaseLayer>
                        <LayersControl.Overlay name="Marker with popup">
                            <Marker position={this.props.position}>
                                <Popup>
                                    A pretty CSS3 popup. <br /> Easily customizable.
                                </Popup>
                            </Marker>
                        </LayersControl.Overlay>
                        {polygonOverlay}
                    </LayersControl>
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
        selectedBaseLayer: state.work.imageryLayer,
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
        onBaseLayerChanged: (layer: ImageryLayer) => {
            console.log("Base layer changed", layer);
        }
    }
}

export const MapContainer = connect(mapStateToProps, mapDispatchToProps)(MapComponent);
