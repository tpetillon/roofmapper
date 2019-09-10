import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';

import { Button, Icon } from 'antd';

import { AppState } from "../reducers";
import { SessionStatus } from '../reducers/Session';
import * as actions from '../actions';

function statusToText(status: SessionStatus) {
    switch (status) {
        case SessionStatus.NoSession:
            return 'No session';
        case SessionStatus.Creating:
            return 'Opening session...';
        case SessionStatus.Created:
            return 'Session created';
        case SessionStatus.Error:
            return 'Session error';
        default:
            return 'Error, unhandled case: ' + status;
    }
}

interface Props {
    status: SessionStatus;
    sessionId: string | undefined;
    taggedBuildingCount: number;
    invalidatedBuildingCount: number;
    uploadedBuildingCount: number;

    uploadTags?: () => void;
}

class SessionComponent extends React.Component<Props, object> {
    render() {
        let statusText = statusToText(this.props.status);
        if (this.props.sessionId) {
            statusText += ' (' + this.props.sessionId + ')';
        }

        const uploadButtonDisabled = this.props.taggedBuildingCount === 0;

        return (
            <div>
            <div className="session-details">
                <p>{statusText}</p>
                <p>{this.props.taggedBuildingCount} buildings tagged</p>
                <p>{this.props.invalidatedBuildingCount} buildings invalidated</p>
                <p>{this.props.uploadedBuildingCount} buildings uploaded</p>
            </div>
                <Button type="primary" disabled={uploadButtonDisabled} onClick={this.props.uploadTags}>
                    <Icon type="cloud-upload"/>
                    Upload tags
                </Button>
            </div>
        );
    }
}

export function mapStateToProps(state: AppState): Props {
    return {
        status: state.session.status,
        sessionId: state.session.sessionId,
        taggedBuildingCount: state.session.taggedBuildingCount,
        invalidatedBuildingCount: state.session.invalidatedBuildingCount,
        uploadedBuildingCount: state.session.uploadedBuildingCount
    };
}

export function mapDispatchToProps(dispatch: Dispatch<actions.RootAction>) {
    return {
        uploadTags: () => {
            dispatch(actions.uploadTags());
        }
    }
}

export const SessionContainer = connect(mapStateToProps, mapDispatchToProps)(SessionComponent);
