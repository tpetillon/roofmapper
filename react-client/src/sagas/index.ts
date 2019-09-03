import { all, cancel, cps, fork, put, take, select } from 'redux-saga/effects';
import { getType } from 'typesafe-actions';
import OSMAuth from 'osm-auth';
import * as actions from '../actions';
import { OsmLoginStatus, SessionStatus } from '../reducers';
import * as selectors from '../selectors';
import { BuildingService } from './BuildingService';
import { Building, setBuildingData } from '../reducers/Building';

function* loginToOsm(osmAuth: OSMAuth.OSMAuthInstance) {
    try {
        yield put(actions.setOsmLoginStatus(OsmLoginStatus.LoggingIn));

        yield cps(cb => osmAuth.authenticate(error => cb(error, null)));

        yield put(actions.setOsmLoginStatus(OsmLoginStatus.FetchingDetails));

        const details = yield cps(cb => osmAuth.xhr({
                path: '/api/0.6/user/details',
                method: 'GET'
            },
            (error, result) => cb(error, result)));
        
        const u = details.getElementsByTagName('user')[0];
        const username = u.getAttribute('display_name');
        const userId = u.getAttribute('id');

        yield put(actions.setOsmUserDetails(username, userId));
    } catch (error) {
        yield put(actions.setOsmLoginStatus(OsmLoginStatus.Error));
    }
}

function* openSession(userId: string) {
    try {
        yield put(actions.setSessionStatus(SessionStatus.Creating));

        const sessionId = yield BuildingService.openSession(userId);

        yield put(actions.setSessionDetails(sessionId));
    } catch (error) {
        yield put(actions.setSessionStatus(SessionStatus.Error));
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

function fetchBuildingData(building: Building, osmAuth: OSMAuth.OSMAuthInstance) {
    return cps(cb => osmAuth.xhr({
            path: '/api/0.6/' + building.type + '/' + building.id + '/full',
            method: 'GET'
        },
        (error, result) => cb(error, result)));
}

function* fetchBuildings(osmAuth: OSMAuth.OSMAuthInstance) {
    const sessionId: ReturnType<typeof selectors.sessionId> = yield select(selectors.sessionId);

    if (!sessionId) {
        return;
    }

    const building: Building = yield BuildingService.getBuilding(sessionId);
    const buildingData: XMLDocument = yield fetchBuildingData(building, osmAuth);
    if (setBuildingData(building, buildingData)) {
        yield put(actions.addBuilding(building));
        yield put(actions.selectLastBuilding());
    } else {
        // @Todo
    }

    while (true) {
        yield take(getType(actions.requestBuilding));
        const building: Building = yield BuildingService.getBuilding(sessionId);
        const buildingData: XMLDocument = yield fetchBuildingData(building, osmAuth);
        if (setBuildingData(building, buildingData)) {
            yield put(actions.addBuilding(building));
            yield put(actions.selectLastBuilding());
        } else {
            // @Todo
        }
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
        yield take(getType(actions.requestOsmLogin));
        const loginTask = yield fork(initialLoginFlow, osmAuth);
        yield take(getType(actions.requestOsmLogout));
        yield cancel(loginTask);
        
        const sessionId: ReturnType<typeof selectors.sessionId> = yield select(selectors.sessionId);
        yield put(actions.setSessionStatus(SessionStatus.NoSession));
        yield put(actions.setOsmLoginStatus(OsmLoginStatus.LoggedOut));

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
