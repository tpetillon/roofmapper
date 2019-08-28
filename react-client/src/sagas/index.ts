import { all, cancel, cps, fork, put, take, select } from 'redux-saga/effects';
import OSMAuth from 'osm-auth';
import {
    moveTo,
    setOsmLoginStatus, setOsmUserDetails,
    REQUEST_OSM_LOGIN, REQUEST_OSM_LOGOUT,
    setSessionDetails, setSessionStatus, addBuilding, selectLastBuilding,
} from '../actions';
import { OsmLoginStatus, SessionStatus } from '../reducers';
import * as selectors from '../selectors';
import { BuildingService } from './BuildingService';
import { Building } from '../reducers/Building';
import { Coordinates } from '../Coordinates';

function* loginToOsm(osmAuth: OSMAuth.OSMAuthInstance) {
    try {
        yield put(setOsmLoginStatus(OsmLoginStatus.LoggingIn));

        yield cps(cb => osmAuth.authenticate(error => cb(error, null)));

        yield put(setOsmLoginStatus(OsmLoginStatus.FetchingDetails));

        const details = yield cps(cb => osmAuth.xhr({
                path: '/api/0.6/user/details',
                method: 'GET'
            },
            (error, result) => cb(error, result)));
        
        const u = details.getElementsByTagName('user')[0];
        const username = u.getAttribute('display_name');
        const userId = u.getAttribute('id');

        yield put(setOsmUserDetails(username, userId));
    } catch (error) {
        yield put(setOsmLoginStatus(OsmLoginStatus.Error));
    }
}

function* openSession(userId: string) {
    try {
        yield put(setSessionStatus(SessionStatus.Creating));

        const sessionId = yield BuildingService.openSession(userId);

        yield put(setSessionDetails(sessionId));
    } catch (error) {
        yield put(setSessionStatus(SessionStatus.Error));
    }
}

function* initialLoginFlow(osmAuth: OSMAuth.OSMAuthInstance) {
    yield loginToOsm(osmAuth);

    const userId: ReturnType<typeof selectors.osmUserId> = yield select(selectors.osmUserId);
    if (userId) {
        yield openSession(userId);
    }

    yield fetchBuildings(osmAuth);
}

function* fetchBuildings(osmAuth: OSMAuth.OSMAuthInstance) {
    const sessionId: ReturnType<typeof selectors.sessionId> = yield select(selectors.sessionId);

    if (!sessionId) {
        return;
    }

    const building: Building = yield BuildingService.getBuilding(sessionId);
    const buildingData: XMLDocument = yield cps(cb => osmAuth.xhr({
            path: '/api/0.6/' + building.type + '/' + building.id + '/full',
            method: 'GET'
        },
        (error, result) => cb(error, result)));
    if (building.setData(buildingData)) {
        yield put(addBuilding(building));
        yield put(selectLastBuilding());

        const position: ReturnType<typeof selectors.currentBuildingPosition> =
            yield select(selectors.currentBuildingPosition);
        if (position) {
            yield put(moveTo(new Coordinates(position.lng, position.lat), 9));
        }
    } else {
        // @Todo
    }
}

function* osmLoginFlow() {
    const osmAuthOptions: OSMAuth.OSMAuthOptions = {
        oauth_consumer_key: 'aF9d6GToknMHKvU7KLo208XCMaHxPo2EtyMxgLtd',
        oauth_secret: '0QrDWTZMCG0IYFnm92iq045HTzv26p1QzwhhItaV',
        auto: false,
        landing: "/osm-auth-land.html"
    };

    const osmAuth = new OSMAuth(osmAuthOptions);
    
    while (true) {
        yield take(REQUEST_OSM_LOGIN);
        const loginTask = yield fork(initialLoginFlow, osmAuth);
        yield take(REQUEST_OSM_LOGOUT);
        yield cancel(loginTask);
        
        const sessionId: ReturnType<typeof selectors.sessionId> = yield select(selectors.sessionId);
        yield put(setSessionStatus(SessionStatus.NoSession));
        yield put(setOsmLoginStatus(OsmLoginStatus.LoggedOut));

        // @Todo Do these two actions in parallel
        if (sessionId) {
            yield BuildingService.closeSession(sessionId);
        }
        osmAuth.logout();
    }
}

export function* rootSaga() {
    yield all([
        osmLoginFlow()
    ]);
}
