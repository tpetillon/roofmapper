import { createAction, ActionType } from 'typesafe-actions';
import { LatLng } from 'leaflet';
import { OsmLoginStatus, SessionStatus } from '../reducers';
import { Building } from '../reducers/Building';

export const moveTo = createAction('MOVE_TO', action => {
    return (position: LatLng, zoomLevel: number) =>
        action({
            position: position,
            zoomLevel: zoomLevel
        });
});

export type MapAction = ActionType<typeof moveTo>;

export const setOsmLoginStatus = createAction('SET_OSM_LOGIN_STATUS', action => {
    return (status: OsmLoginStatus) =>
        action({
            status: status
        });
});

export const setOsmUserDetails = createAction('SET_OSM_USER_DETAILS', action => {
    return (username: string | undefined, userId: string | undefined) =>
        action({
            username: username,
            userId: userId
        });
});

export const requestOsmLogin = createAction('REQUEST_OSM_LOGIN', action => {
    return () => action({});
});

export const requestOsmLogout = createAction('REQUEST_OSM_LOGOUT', action => {
    return () => action({});
});

export type OsmLoginAction =
    ActionType<typeof setOsmLoginStatus> |
    ActionType<typeof setOsmUserDetails> |
    ActionType<typeof requestOsmLogin> |
    ActionType<typeof requestOsmLogout>;
    
export const setSessionStatus = createAction('SET_SESSION_STATUS', action => {
    return (status: SessionStatus) =>
        action({
            status: status
        });
});

export const setSessionDetails = createAction('SET_SESSION_DETAILS', action => {
    return (sessionId: string | undefined) =>
        action({
            sessionId: sessionId
        });
});

export const addBuilding = createAction('ADD_BUILDING', action => {
    return (building: Building) =>
        action({
            building: building
        });
});

export const setBuildingIndex = createAction('SET_BUILDING_INDEX', action => {
    return (index: number) =>
        action({
            index: index
        });
});

export const selectLastBuilding = createAction('SELECT_LAST_BUILDING', action => {
    return () => action({});
});

export type SessionAction =
    ActionType<typeof setSessionStatus> |
    ActionType<typeof setSessionDetails> |
    ActionType<typeof addBuilding> |
    ActionType<typeof setBuildingIndex> |
    ActionType<typeof selectLastBuilding>;

export type RootAction = 
    MapAction |
    OsmLoginAction |
    SessionAction;
