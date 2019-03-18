import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';

import { AppState } from '../store';
import { OsmConnectionStatus } from '../reducers';
import * as actions from '../actions';

function statusToText(status: OsmConnectionStatus) {
    switch (status) {
        case OsmConnectionStatus.Disconnected:
            return 'Disconnected';
        case OsmConnectionStatus.Connecting:
            return 'Connecting...';
        case OsmConnectionStatus.Connected:
            return 'Connected';
        case OsmConnectionStatus.Error:
            return 'Connection error';
        default:
            return 'Error, unhandled case: ' + status;
    }
}

interface Props {
    status: OsmConnectionStatus;
    username: string;
    onRequestConnection?: () => void;
    onRequestDisconnection?: () => void;
}

class MapContainer extends React.Component<Props, object> {
    render() {
        let statusText = statusToText(this.props.status);
        if (this.props.username != '') {
            statusText += ' (' + this.props.username + ')';
        }

        let button = undefined;
        if (this.props.status == OsmConnectionStatus.Disconnected || this.props.status == OsmConnectionStatus.Error) {
            button = <button onClick={this.props.onRequestConnection}>Connect to OSM</button>;
        } else if (this.props.status == OsmConnectionStatus.Connected) {
            button = <button onClick={this.props.onRequestDisconnection}>Disconnect from OSM</button>;
        }

        return (
            <div className="osm-connection">
                <p>{statusText}</p>
                {button}
            </div>
        );
    }
}

export function mapStateToProps(state: AppState): Props {
    return {
        status: state.osmConnection.status,
        username: state.osmConnection.username
    };
}

export function mapDispatchToProps(dispatch: Dispatch<actions.OsmConnectionAction>) {
    return {
        onRequestConnection: () => {
            dispatch(actions.requestOsmConnection());
        },
        onRequestDisconnection: () => {
            dispatch(actions.requestOsmDisconnection());
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(MapContainer);