declare module 'react-leaflet-bing' {
    import { GridLayer } from 'react-leaflet';

    export type BingImageryType =
        'Aerial' |
        'AerialWithLabels' |
        'AerialWithLabelsOnDemand' |
        'CanvasDark' |
        'CanvasLight' |
        'CanvasGray' |
        'Road' |
        'RoadOnDemand' |
        'OrdnanceSurvey';

    export interface BingLayerProps extends GridLayerProps, TileLayerEvents, Leaflet.GridLayerOptions {
        bingkey: string;
        type: BingImageryType;
        culture?: string;
        style?: string;
    }

    export class BingLayer<P extends BingLayerProps = BingLayerProps, E extends Leaflet.GridLayer = Leaflet.GridLayer> extends GridLayer<P, E> {
        createLeafletElement(props: P): E;
        updateLeafletElement(fromProps: P, toProps: P): void;
    }
}
