import { all, cancel, cps, fork, put, take } from 'redux-saga/effects';
import OSMAuth from 'osm-auth';
import { setOsmLoginStatus, setOsmUserDetails, REQUEST_OSM_LOGIN, REQUEST_OSM_LOGOUT } from '../actions';
import { OsmLoginStatus } from '../reducers';

function* loginToOsm(osmAuth: OSMAuth.OSMAuthInstance) {
    try {
        yield put(setOsmLoginStatus(OsmLoginStatus.LoggingIn));

        yield cps(cb => osmAuth.authenticate(error => cb(error, null)));

        yield put(setOsmLoginStatus(OsmLoginStatus.LoggedIn));

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
        const connectTask = yield fork(loginToOsm, osmAuth);
        yield take(REQUEST_OSM_LOGOUT);
        yield cancel(connectTask);
        osmAuth.logout();
        yield put(setOsmUserDetails(undefined, undefined));
        yield put(setOsmLoginStatus(OsmLoginStatus.LoggedOut));
    }
}

export function* rootSaga() {
    yield all([
        osmLoginFlow()
    ]);
}
