import { all, cancel, cps, fork, put, take } from 'redux-saga/effects';
import OSMAuth from 'osm-auth';
import { setOsmConnectionStatus, setOsmUserDetails, REQUEST_OSM_CONNECTION, REQUEST_OSM_DISCONNECTION } from '../actions';
import { OsmConnectionStatus } from '../reducers';

function* connectToOsm(osmAuth: OSMAuth.OSMAuthInstance) {
    try {
        yield put(setOsmConnectionStatus(OsmConnectionStatus.Connecting));

        yield cps(cb => osmAuth.authenticate(error => cb(error, null)));

        yield put(setOsmConnectionStatus(OsmConnectionStatus.Connected));

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
        yield put(setOsmConnectionStatus(OsmConnectionStatus.Error));
    }
}

function* osmConnectionFlow() {
    const osmAuthOptions: OSMAuth.OSMAuthOptions = {
        oauth_consumer_key: 'aF9d6GToknMHKvU7KLo208XCMaHxPo2EtyMxgLtd',
        oauth_secret: '0QrDWTZMCG0IYFnm92iq045HTzv26p1QzwhhItaV',
        auto: false,
        landing: "/osm-auth-land.html"
    };

    const osmAuth = new OSMAuth(osmAuthOptions);
    
    while (true) {
        yield take(REQUEST_OSM_CONNECTION);
        const connectTask = yield fork(connectToOsm, osmAuth);
        yield take(REQUEST_OSM_DISCONNECTION);
        yield cancel(connectTask);
        osmAuth.logout();
        yield put(setOsmUserDetails(undefined, undefined));
        yield put(setOsmConnectionStatus(OsmConnectionStatus.Disconnected));
    }
}

export default function* rootSaga() {
    yield all([
        osmConnectionFlow()
    ]);
}
