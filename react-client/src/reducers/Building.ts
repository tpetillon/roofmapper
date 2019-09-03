import { Polygon, Multipolygon, computeMultipolygonBounds } from "./Polygon";
import { Point } from "./Point";
import { Bounds, getBoundsCenter } from "./Bounds";

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

interface OsmTag {
    key: string;
    value: string;
}

interface OsmNode {
    id: number;
    position: Point;
}

interface OsmWay {
    id: number;
    nodes: OsmNode[];
    tags: OsmTag[];
}

interface OsmRelationMember {
    type: OsmObjectType;
    ref: number;
    role: string;
}

interface OsmRelation {
    id: number;
    members: OsmRelationMember[];
    outerWays: OsmWay[];
    innerWays: OsmWay[];
    tags: OsmTag[];
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

export enum RoofMaterial {
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

export interface Building {
    type: BuildingType;
    id: number;
    version: number;

    tags: OsmTag[];
    nodes: OsmNode[]; // for ways
    members: OsmRelationMember[]; // for relations

    roofMaterial: RoofMaterial | undefined;
    invalidityReason: InvalidityReason | undefined;

    polygon: Multipolygon | undefined;
    bounds: Bounds | undefined;
}

export function newBuilding(type: BuildingType, id: number, version: number): Building {
    return {
        type: type,
        id: id,
        version: version,
        tags: [],
        nodes: [],
        members: [],
        roofMaterial: undefined,
        invalidityReason: undefined,
        polygon: undefined,
        bounds: undefined
    }
}

export function getBuildingPosition(building: Building): Point | undefined {
    if (building.bounds) {
        return getBoundsCenter(building.bounds);
    } else {
        return undefined;
    }
}

export function getBuildingBounds(building: Building): Bounds | undefined {
    return building.bounds;
}

/**
 * @returns `true` if the supplied data corresponds to the building,
 *          `false` otherwise.
 */
export function setBuildingData(building: Building, data: XMLDocument): boolean {
    const checkResult = checkIdAndVersion(building, data);
    if (!checkResult) {
        return false;
    }

    switch (building.type) {
        case (BuildingType.Way):
            const ways = extractWays(data);
            if (ways.size === 0) {
                return true;
            }

            const way = ways.get(building.id)
            if (!way) {
                return true;
            }

            const positions = way.nodes.map(node => node.position);
            building.polygon = { outers: [{ points: positions }], inners: [] };

            building.nodes = way.nodes;
            building.tags = way.tags;
            break;
        case (BuildingType.Relation):
            const relations = extractRelations(data);
            if (relations.size === 0) {
                return true;
            }

            const relation = relations.get(building.id);
            if (!relation) {
                return true;
            }

            const outers = relation.outerWays.map(way => ({ points: way.nodes.map(node => node.position) } as Polygon));
            const inners = relation.innerWays.map(way => ({ points: way.nodes.map(node => node.position) } as Polygon));
            building.polygon = { outers: outers, inners: inners };

            building.members = relation.members;
            building.tags = relation.tags;
            break;
        default:
            throw new Error('Unsupported building type: ' + building.type);
    }
    
    building.bounds = computeMultipolygonBounds(building.polygon);
    
    for (let i = 0; i < building.tags.length; i++) {
        const tag = building.tags[i];
        if (tag.key === 'roof:material') {
            building.roofMaterial = RoofMaterialFromString(tag.value);
            building.tags.splice(i, 1);
            break;
        }
    }

    return true;
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

function extractNodes(data: XMLDocument): Map<number, Point> {
    let nodes = new Map<number, Point>();

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
    
            nodes.set(id, { longitude: lon, latitude: lat });
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
                return {
                    id: nodeId,
                    position: position ? position : { longitude: 0, latitude: 0 },
                } as OsmNode;
            });
            
            const tags = extractTags(osmChild);

            ways.set(id, { id: id, nodes: nodes, tags: tags } as OsmWay);
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

                members.push({ type: type, ref: ref, role: role } as OsmRelationMember);

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

            relations.set(id, {
                id: id,
                members: members,
                outerWays: outerWays,
                innerWays: innerWays,
                tags: tags
            } as OsmRelation);
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

        tags.push({ key: kAttr.value, value: vAttr.value } as OsmTag);
    }

    return tags;
}
