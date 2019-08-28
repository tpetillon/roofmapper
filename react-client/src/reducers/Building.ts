import { LatLng, Polygon, LatLngBounds } from 'leaflet';

enum OsmObjectType {
    Node = 'node',
    Way = 'way',
    Relation = 'relation',
}

function OsmObjectTypeFromString(type: string) {
    switch (type) {
        case 'node':
            return OsmObjectType.Node;
        case 'way':
            return OsmObjectType.Way;
        case 'relation':
            return OsmObjectType.Relation;
        default:
            return undefined;
    }
}

class OsmTag {
    public readonly key: string;
    public readonly value: string;

    constructor(key: string, value: string) {
        this.key = key;
        this.value = value;
    }
}

class OsmNode {
    public readonly id: number;
    public readonly position: LatLng;

    constructor(id: number, position: LatLng) {
        this.id = id;
        this.position = position;
    }
}

class OsmWay {
    public readonly id: number;
    public readonly nodes: OsmNode[];
    public readonly tags: OsmTag[];

    constructor(id: number, nodes: OsmNode[], tags: OsmTag[]) {
        this.id = id;
        this.nodes = nodes;
        this.tags = tags;
    }
}

class OsmRelationMember {
    public readonly type: OsmObjectType;
    public readonly ref: number;
    public readonly role: string;

    constructor(type: OsmObjectType, ref: number, role: string) {
        this.type = type;
        this.ref = ref;
        this.role = role;
    }
}

class OsmRelation {
    public readonly id: number;
    public readonly members: OsmRelationMember[];
    public readonly outerWays: OsmWay[];
    public readonly innerWays: OsmWay[];
    public readonly tags: OsmTag[];

    constructor(id: number, members: OsmRelationMember[], outerWays: OsmWay[], innerWays: OsmWay[], tags: OsmTag[]) {
        this.id = id;
        this.members = members;
        this.outerWays = outerWays;
        this.innerWays = innerWays;
        this.tags = tags;
    }
}

export enum BuildingType {
    Way = 'way',
    Relation = 'relation',
}

export function BuildingTypeFromString(type: string) {
    switch (type) {
        case 'way':
            return BuildingType.Way;
        case 'relation':
            return BuildingType.Relation;
        default:
            return undefined;
    }
}

enum RoofMaterial {
    Tiles = 'roof_tiles',
    Slate = 'slate',
    Metal = 'metal',
    Copper = 'copper',
    Concrete = 'concrete',
    Glass = 'glass',
    TarPaper = 'tar_paper',
    Eternit = 'eternit',
    Gravel = 'gravel',
    Grass = 'grass',
    Plants = 'plants',
    Stone = 'stone',
    Thatch = 'thatch',
}

function RoofMaterialFromString(type: string) {
    switch (type) {
        case 'roof_tiles':
            return RoofMaterial.Tiles;
        case 'slate':
            return RoofMaterial.Slate;
        case 'metal':
            return RoofMaterial.Metal;
        case 'copper':
            return RoofMaterial.Copper;
        case 'concrete':
            return RoofMaterial.Concrete;
        case 'glass':
            return RoofMaterial.Glass;
        case 'tar_paper':
            return RoofMaterial.TarPaper;
        case 'eternit':
            return RoofMaterial.Eternit;
        case 'gravel':
            return RoofMaterial.Gravel;
        case 'grass':
            return RoofMaterial.Grass;
        case 'plants':
            return RoofMaterial.Plants;
        case 'stone':
            return RoofMaterial.Stone;
        case 'thatch':
            return RoofMaterial.Thatch;
        default:
            return undefined;
    }
}

enum InvalidityReason {
    //Outdated = 'outdated',
    MultipleMaterials = 'multiple_materials',
    MultipleBuildings = 'multiple_buildings',
    BuildingFraction = 'building_fraction',
    NotABuilding = 'not_a_building',
}

export class Building {
    readonly type: BuildingType;
    readonly id: number;
    readonly version: number;

    tags: OsmTag[] = [];
    nodes: OsmNode[] = []; // for ways
    members: OsmRelationMember[] = []; // for relations

    _roofMaterial: RoofMaterial | undefined = undefined;
    _invalidityReason: InvalidityReason | undefined = undefined;

    _polygon: Polygon | undefined = undefined;
    
    constructor(type: BuildingType, id: number, version: number) {
        this.type = type;
        this.id = id;
        this.version = version;
    }

    get roofMaterial(): RoofMaterial | undefined {
        return this._roofMaterial;
    }

    set roofMaterial(newMaterial: RoofMaterial | undefined) {
        this._roofMaterial = newMaterial;
        this._invalidityReason = undefined;
    }

    get invalidityReason(): InvalidityReason | undefined {
        return this._invalidityReason;
    }

    set invalidityReason(newReason: InvalidityReason | undefined) {
        this._invalidityReason = newReason;
        this._roofMaterial = undefined;
    }

    get polygon(): Polygon | undefined {
        return this._polygon;
    }

    get position(): LatLng | undefined {
        if (this._polygon) {
            return this._polygon.getBounds().getCenter();
        } else {
            return undefined;
        }
    }

    get bounds(): LatLngBounds | undefined {
        if (this._polygon) {
            return this._polygon.getBounds();
        } else {
            return undefined;
        }
    }

    /**
     * @returns `true` if the supplied data corresponds to the building,
     *          `false` otherwise.
     */
    setData(data: XMLDocument): boolean {
        const checkResult = checkIdAndVersion(this, data);
        if (!checkResult) {
            return false;
        }

        switch (this.type) {
            case (BuildingType.Way):
                const ways = extractWays(data);
                if (ways.size === 0) {
                    return true;
                }

                const way = ways.get(this.id)
                if (!way) {
                    return true;
                }

                const positions = way.nodes.map(node => node.position);
                this._polygon = new Polygon(positions);

                this.nodes = way.nodes;
                this.tags = way.tags;
                break;
            case (BuildingType.Relation):
                const relations = extractRelations(data);
                if (relations.size === 0) {
                    return true;
                }

                const relation = relations.get(this.id);
                if (!relation) {
                    return true;
                }

                let polygons = new Array<Array<Array<LatLng>>>();
                for (let outerWay of relation.outerWays) {
                    polygons.push([outerWay.nodes.map(node => node.position)].concat(
                        relation.innerWays.map(way => way.nodes.map(node => node.position))));
                }
                this._polygon = new Polygon(polygons);
                this.members = relation.members;
                this.tags = relation.tags;
                break;
            default:
                throw new Error('Unsupported building type: ' + this.type);
        }
        
        for (let i = 0; i < this.tags.length; i++) {
            const tag = this.tags[i];
            if (tag.key === 'roof:material') {
                this._roofMaterial = RoofMaterialFromString(tag.value);
                this.tags.splice(i, 1);
                break;
            }
        }

        return true;
    }
}

function checkIdAndVersion(building: Building, data: XMLDocument): boolean {
    for (let dataChild of data.children) {
        if (dataChild.tagName !== 'osm') {
            continue;
        }

        for (let osmChild of dataChild.children) {
            if (osmChild.tagName === building.type as string) {
                const idAttr = osmChild.attributes.getNamedItem('id');
                const versionAttr = osmChild.attributes.getNamedItem('version');

                if (!idAttr || !versionAttr) {
                    continue;
                }

                const id = parseInt(idAttr.value);
                const version = parseInt(versionAttr.value);

                return id === building.id && version === building.version;
            }
        }
    }

    return false;
}

function extractNodes(data: XMLDocument): Map<number, LatLng> {
    let nodes = new Map<number, LatLng>();

    for (let dataChild of data.children) {
        if (dataChild.tagName !== 'osm') {
            continue;
        }

        for (let osmChild of dataChild.children) {
            if (osmChild.tagName !== 'node') {
                continue;
            }

            const idAttr = osmChild.attributes.getNamedItem('id');
            const latAttr = osmChild.attributes.getNamedItem('lat');
            const lonAttr = osmChild.attributes.getNamedItem('lon');
    
            if (!idAttr || !latAttr || !lonAttr) {
                continue;
            }
    
            const id = parseInt(idAttr.value);
            const lat = parseFloat(latAttr.value);
            const lon = parseFloat(lonAttr.value);
    
            nodes.set(id, new LatLng(lat, lon));
        }
    }
    
    return nodes;
}

function extractWays(data: XMLDocument): Map<number, OsmWay> {
    let ways = new Map<number, OsmWay>();

    const nodePositions = extractNodes(data);

    for (let dataChild of data.children) {
        if (dataChild.tagName !== 'osm') {
            continue;
        }

        for (let osmChild of dataChild.children) {
            if (osmChild.tagName !== 'way') {
                continue;
            }

            const idAttr = osmChild.attributes.getNamedItem('id');
            if (!idAttr) {
                continue;
            }
            
            const id = parseInt(idAttr.value);

            let nodeIds = new Array<number>();

            for (let wayChild of osmChild.children) {
                if (wayChild.tagName !== 'nd') {
                    continue;
                }

                const refAttr = wayChild.attributes.getNamedItem('ref');
                if (!refAttr) {
                    continue;
                }

                const ref = parseInt(refAttr.value);
                nodeIds.push(ref);
            }

            const nodes = nodeIds.map(nodeId => {
                const position = nodePositions.get(nodeId);
                return new OsmNode(nodeId, position ? position : new LatLng(0, 0));
            });
            
            const tags = extractTags(osmChild);

            ways.set(id, new OsmWay(id, nodes, tags));
        }
    }
    
    return ways;
}

function extractRelations(data: XMLDocument): Map<number, OsmRelation> {
    const ways = extractWays(data);

    let relations = new Map<number, OsmRelation>();

    for (let dataChild of data.children) {
        if (dataChild.tagName !== 'osm') {
            continue;
        }

        for (let osmChild of dataChild.children) {
            if (osmChild.tagName !== 'relation') {
                continue;
            }

            const idAttr = osmChild.attributes.getNamedItem('id');
            if (!idAttr) {
                continue;
            }

            const id = parseInt(idAttr.value);
            
            let outerWays = new Array<OsmWay>();
            let innerWays = new Array<OsmWay>();
            let members = new Array<OsmRelationMember>();

            for (let relationChild of dataChild.children) {
                if (relationChild.tagName !== 'member') {
                    continue;
                }

                const typeAttr = relationChild.attributes.getNamedItem('type');
                if (!typeAttr) {
                    continue;
                }
                
                const refAttr = relationChild.attributes.getNamedItem('ref');
                const roleAttr = relationChild.attributes.getNamedItem('role');
                if (!refAttr || !roleAttr) {
                    continue;
                }
                
                const type = OsmObjectTypeFromString(typeAttr.value);
                const ref = parseInt(refAttr.value);
                const role = roleAttr.value;

                if (!type) {
                    continue;
                }

                members.push(new OsmRelationMember(type, ref, role));

                if (typeAttr.value === 'way') {

                    const way = ways.get(ref);
                    if (!way) {
                        continue;
                    }

                    if (role === 'outer') {
                        outerWays.push(way);
                    } else if (role === 'inner') {
                        innerWays.push(way);
                    }
                }
            }

            const tags = extractTags(osmChild);

            relations.set(id, new OsmRelation(id, members, outerWays, innerWays, tags));
        }
    }

    return relations;
}

function extractTags(object: Element): OsmTag[] {
    let tags = new Array<OsmTag>();

    for (let child of object.children) {
        if (child.tagName !== 'tag') {
            continue;
        }

        const kAttr = child.attributes.getNamedItem('k');
        const vAttr = child.attributes.getNamedItem('v');

        if (!kAttr || !vAttr) {
            continue;
        }

        tags.push(new OsmTag(kAttr.value, vAttr.value));
    }

    return tags;
}
