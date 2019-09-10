import { Building, BuildingType, RoofMaterial } from "./Building";
import { Session } from "./Session";

function buildingToOsmChange(building: Building, changesetId: number): string {
    if (!building.roofMaterial) {
        return '';
    }
    
    let xml = '';
    xml += '<modify>';
    xml += '<' + building.type + ' id="' + building.id + '" changeset="' + changesetId + '" version="' + building.version + '">';
    
    if (building.type === BuildingType.Way) {
        building.nodes.forEach(function(node) {
            xml +=  '<nd ref="' + node.id + '" />';
        });
    } else if (building.type === BuildingType.Relation) {
        building.members.forEach(function(member) {
            xml +=  '<member type="' + member.type + '" ref="' + member.ref + '" role="' + member.role + '" />';
        });
    } else {
        throw new Error('Unsupported building type: ' + building.type);
    }
    
    building.tags.forEach(function(tag) {
        xml += '<tag k="' + tag.key + '" v="' + tag.value + '" />';
    });
    
    xml += '<tag k="roof:material" v="' + building.roofMaterial + '" />';
    
    xml += '</' + building.type + '>';
    xml += '</modify>';
    
    return xml;
};

export function sessionToOsmChange(session: Session): string | undefined {
    if (!session.changesetId) {
        return undefined;
    }
    
    const changesetId = session.changesetId;
    
    let xml = '';
    
    xml += '<osmChange version="0.6">';
    
    session.buildings.forEach(function(building) {
        xml += buildingToOsmChange(building, changesetId);
    });
    
    xml += '</osmChange>';
    
    return xml;
}

export interface TagData {
    changeset_id: number,
    tag_data: { type: BuildingType, id: number, roof_material: RoofMaterial}[]
}

export function sessionToTagData(session: Session): TagData | undefined {
    if (!session.changesetId) {
        return undefined;
    }

    let tagData: { type: BuildingType, id: number, roof_material: RoofMaterial}[] = [];

    session.buildings.forEach(building => {
        if (building.roofMaterial) {
            tagData.push({
                type: building.type,
                id: building.id,
                roof_material: building.roofMaterial
            });
        }
    });

    return {
        changeset_id: session.changesetId,
        tag_data: tagData
    }
}
