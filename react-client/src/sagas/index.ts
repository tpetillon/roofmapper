import { all, cancel, cps, fork, put, take, select } from 'redux-saga/effects';
import OSMAuth from 'osm-auth';
import {
    setOsmLoginStatus, setOsmUserDetails,
    REQUEST_OSM_LOGIN, REQUEST_OSM_LOGOUT,
    setSessionDetails, setSessionStatus,
} from '../actions';
import { OsmLoginStatus, SessionStatus } from '../reducers';
import * as selectors from '../selectors';
import { BuildingService } from './BuildingService';

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

function* loginToOsmAndOpenSession(osmAuth: OSMAuth.OSMAuthInstance) {
    yield loginToOsm(osmAuth);

    const userId: ReturnType<typeof selectors.osmUserId> = yield select(selectors.osmUserId);
    if (userId) {
        yield openSession(userId);
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
        const connectTask = yield fork(loginToOsmAndOpenSession, osmAuth);
        yield take(REQUEST_OSM_LOGOUT);
        yield cancel(connectTask);
        
        const sessionId: ReturnType<typeof selectors.sessionId> = yield select(selectors.sessionId);
        if (sessionId) {
            yield BuildingService.closeSession(sessionId);
        }
        yield put(setSessionStatus(SessionStatus.NoSession));

        osmAuth.logout();
        yield put(setOsmLoginStatus(OsmLoginStatus.LoggedOut));
    }
}

export function* rootSaga() {
    yield all([
        osmLoginFlow()
    ]);
}
