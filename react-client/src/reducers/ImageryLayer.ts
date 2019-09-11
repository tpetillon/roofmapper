export enum ImageryLayer {
    OpenStreetMap = 'OpenStreetMap',
    BingAerial = 'BingAerial'
}

export function getSourceString(imageryLayer: ImageryLayer): string | undefined {
    switch (imageryLayer) {
        case ImageryLayer.BingAerial:
            return 'Bing';
        default:
            return undefined;
    }
}
