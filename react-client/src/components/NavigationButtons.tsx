import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';

import { Button, Icon } from 'antd';

import { AppState, SessionStatus } from "../reducers";
import * as actions from '../actions';

interface Props {
    buildingCount: number;
    buildingIndex: number;
    canRequestNewBuilding: boolean;
    waitingForNewBuilding: boolean;

    setBuildingIndex?: (index: number) => void;
    requestBuilding?: () => void;
}

class NavigationButtonsComponent extends React.Component<Props, object> {
    private onPrevBuildingClick = () => {
        if (!this.props.setBuildingIndex) {
            return;
        }

        this.props.setBuildingIndex(this.props.buildingIndex - 1);
    }
    
    private onNextBuildingClick = () => {
        if (!this.props.setBuildingIndex || !this.props.requestBuilding) {
            return;
        }

        if (this.props.buildingIndex < this.props.buildingCount - 1) {
            this.props.setBuildingIndex(this.props.buildingIndex + 1);
        } else {
            this.props.requestBuilding();
        }
    }

    render() {
        const hasPrevBuilding = this.props.buildingIndex > 0;
        const hasNextBuilding = this.props.buildingIndex < this.props.buildingCount - 1;
        const prevButtonDisabled = this.props.waitingForNewBuilding || !hasPrevBuilding;
        const nextButtonDisabled = this.props.waitingForNewBuilding ||
            (!hasNextBuilding && !this.props.canRequestNewBuilding);

        return (
            <Button.Group size="large">
                <Button type="primary" disabled={prevButtonDisabled} onClick={this.onPrevBuildingClick}>
                    <Icon type="left" />
                    Previous building
                </Button>
                <Button type="primary" disabled={nextButtonDisabled} onClick={this.onNextBuildingClick}>
                    Next building
                    <Icon type="right" />
                </Button>
            </Button.Group>
        );
    }
}

export function mapStateToProps(state: AppState): Props {
    return {
        buildingCount: state.session.buildings.length,
        buildingIndex: state.session.currentBuildingIndex,
        canRequestNewBuilding: state.session.status === SessionStatus.Created,
        waitingForNewBuilding: state.session.waitingForNewBuilding
    };
}

export function mapDispatchToProps(dispatch: Dispatch<actions.SessionAction>) {
    return {
        setBuildingIndex: (index: number) => {
            dispatch(actions.setBuildingIndex(index));
        },
        requestBuilding: () => {
            dispatch(actions.requestBuilding());
        }
    }
}

export const NavigationButtonsContainer = connect(mapStateToProps, mapDispatchToProps)(NavigationButtonsComponent);
