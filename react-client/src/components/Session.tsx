import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';

import { AppState } from '../store';
import { SessionStatus } from "../reducers";
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
}

class SessionComponent extends React.Component<Props, object> {
    render() {
        let statusText = statusToText(this.props.status);
        if (this.props.sessionId) {
            statusText += ' (' + this.props.sessionId + ')';
        }

        return (
            <div className="session-details">
                <p>{statusText}</p>
            </div>
        );
    }
}

export function mapStateToProps(state: AppState): Props {
    return {
        status: state.session.status,
        sessionId: state.session.sessionId
    };
}

export function mapDispatchToProps(dispatch: Dispatch<actions.SessionAction>) {
    return {
    }
}

export const SessionContainer = connect(mapStateToProps, mapDispatchToProps)(SessionComponent);
