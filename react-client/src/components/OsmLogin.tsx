import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';

import { AppState } from '../store';
import { OsmLoginStatus } from '../reducers';
import * as actions from '../actions';

function statusToText(status: OsmLoginStatus) {
    switch (status) {
        case OsmLoginStatus.LoggedOut:
            return 'Logged out';
        case OsmLoginStatus.LoggingIn:
            return 'Logging in...';
        case OsmLoginStatus.FetchingDetails:
            return 'Fetch user details...';
        case OsmLoginStatus.LoggedIn:
            return 'Logged in';
        case OsmLoginStatus.Error:
            return 'Login error';
        default:
            return 'Error, unhandled case: ' + status;
    }
}

interface Props {
    status: OsmLoginStatus;
    username: string | undefined;
    userId: string | undefined;
    onRequestLogin?: () => void;
    onRequestLogout?: () => void;
}

class LoginComponent extends React.Component<Props, object> {
    render() {
        let statusText = statusToText(this.props.status);
        if (this.props.username && this.props.userId) {
            statusText += ' (' + this.props.username + ' | ' + this.props.userId + ')';
        }

        let button = undefined;
        if (this.props.status === OsmLoginStatus.LoggedOut || this.props.status === OsmLoginStatus.Error) {
            button = <button onClick={this.props.onRequestLogin}>Log in to OSM</button>;
        } else if (this.props.status === OsmLoginStatus.LoggedIn) {
            button = <button onClick={this.props.onRequestLogout}>Log out of OSM</button>;
        }

        return (
            <div className="osm-login">
                <p>{statusText}</p>
                {button}
            </div>
        );
    }
}

export function mapStateToProps(state: AppState): Props {
    return {
        status: state.osmLogin.status,
        username: state.osmLogin.username,
        userId: state.osmLogin.userId
    };
}

export function mapDispatchToProps(dispatch: Dispatch<actions.OsmLoginAction>) {
    return {
        onRequestLogin: () => {
            dispatch(actions.requestOsmLogin());
        },
        onRequestLogout: () => {
            dispatch(actions.requestOsmLogout());
        }
    }
}

export const OsmLoginContainer = connect(mapStateToProps, mapDispatchToProps)(LoginComponent);