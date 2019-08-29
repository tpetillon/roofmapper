import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';

import { Button, Menu, Dropdown, Icon } from 'antd';

import { OsmLoginStatus, AppState } from '../reducers';
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
        //let statusText = statusToText(this.props.status);
        //if (this.props.username && this.props.userId) {
        //    statusText += ' (' + this.props.username + ' | ' + this.props.userId + ')';
        //}

        let menu;
        if (this.props.status === OsmLoginStatus.LoggedOut || this.props.status === OsmLoginStatus.Error) {
            menu = <Button type="primary" onClick={this.props.onRequestLogin}>Log in to OSM</Button>;
        } else if (this.props.status === OsmLoginStatus.LoggingIn || this.props.status === OsmLoginStatus.FetchingDetails) {
            menu = <Button type="primary" disabled>Logging in...</Button>;
        } else if (this.props.status === OsmLoginStatus.LoggedIn) {
            let profileItem;
            if (this.props.username) {
                const profileUrl = 'https://www.openstreetmap.org/user/' + this.props.username;
                profileItem = (
                    <Menu.Item>
                        <a target="_blank" rel="noopener noreferrer" href={profileUrl}>
                            OpenStreetMap profile
                        </a>
                    </Menu.Item>
                );
            } else {
                profileItem = (
                    <Menu.Item disabled>
                        OpenStreetMap profile
                    </Menu.Item>
                )
            }

            const subMenu = (
                <Menu>
                    {profileItem}
                    <Menu.Divider/>
                    <Menu.Item onClick={this.props.onRequestLogout}>
                        Log out
                    </Menu.Item>
                </Menu>
            );
            
            menu = (
                <Dropdown overlay={subMenu}>
                    <Button>
                        {this.props.username || 'Logged in' } <Icon type="down" />
                    </Button>
                </Dropdown>
            );
        } else {
            throw new Error('Unhandled case: ' + this.props.status);
        }

        return (
            <div className="osm-login">
                {menu}
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