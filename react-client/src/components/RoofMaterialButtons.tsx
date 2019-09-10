import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';

import { Button } from 'antd';

import { AppState } from "../reducers";
import { RoofMaterial } from '../reducers/Building';
import * as actions from '../actions';

interface Props {
    hasBuilding: boolean;
    currentMaterial: RoofMaterial | undefined;

    setBuildingRoofMaterial?: (material: RoofMaterial | undefined) => void;
}

class RoofMaterialButtonsComponent extends React.Component<Props, object> {
    private isDisabled(material: RoofMaterial | undefined) {
        return !this.props.hasBuilding || this.props.currentMaterial === material;
    }

    private setMaterial(material: RoofMaterial | undefined) {
        return () => {
            if (this.props.setBuildingRoofMaterial) {
                this.props.setBuildingRoofMaterial(material);
            }
        }
    }

    render() {
        return (
            <Button.Group size="large">
                <Button disabled={this.isDisabled(undefined)} onClick={this.setMaterial(undefined)}>
                    Undefined
                </Button>
                <Button type="primary" disabled={this.isDisabled(RoofMaterial.Tiles)} onClick={this.setMaterial(RoofMaterial.Tiles)}>
                    Tiles
                </Button>
                <Button type="primary" disabled={this.isDisabled(RoofMaterial.Slate)} onClick={this.setMaterial(RoofMaterial.Slate)}>
                    Slate
                </Button>
                <Button type="primary" disabled={this.isDisabled(RoofMaterial.Metal)} onClick={this.setMaterial(RoofMaterial.Metal)}>
                    Metal
                </Button>
                <Button type="primary" disabled={this.isDisabled(RoofMaterial.Copper)} onClick={this.setMaterial(RoofMaterial.Copper)}>
                    Copper
                </Button>
                <Button type="primary" disabled={this.isDisabled(RoofMaterial.Concrete)} onClick={this.setMaterial(RoofMaterial.Concrete)}>
                    Concrete
                </Button>
                <Button type="primary" disabled={this.isDisabled(RoofMaterial.Eternit)} onClick={this.setMaterial(RoofMaterial.Eternit)}>
                    Eternit
                </Button>
                <Button type="primary" disabled={this.isDisabled(RoofMaterial.Gravel)} onClick={this.setMaterial(RoofMaterial.Gravel)}>
                    Gravel
                </Button>
            </Button.Group>
        );
    }
}

export function mapStateToProps(state: AppState): Props {
    const hasBuilding = state.work.currentBuildingIndex !== -1;
    const building = hasBuilding ? state.session.buildings[state.work.currentBuildingIndex] : undefined;

    return {
        hasBuilding: hasBuilding,
        currentMaterial: building ? building.roofMaterial : undefined
    };
}

export function mapDispatchToProps(dispatch: Dispatch<actions.SessionAction>) {
    return {
        setBuildingRoofMaterial: (material: RoofMaterial | undefined) => {
            dispatch(actions.setCurrentBuildingRoofMaterial(material));
        }
    }
}

export const RoofMaterialButtonsContainer = connect(mapStateToProps, mapDispatchToProps)(RoofMaterialButtonsComponent);
