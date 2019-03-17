import { all, cps, put, takeEvery } from 'redux-saga/effects';
import OSMAuth from 'osm-auth';
import { setOsmConnectionStatus, setOsmUserDetails, REQUEST_OSM_CONNECTION, REQUEST_OSM_DISCONNECTION } from '../actions';
import { OsmConnectionStatus } from '../reducers';

const osmAuthOptions: OSMAuth.OSMAuthOptions = {
    oauth_consumer_key: 'aF9d6GToknMHKvU7KLo208XCMaHxPo2EtyMxgLtd',
    oauth_secret: '0QrDWTZMCG0IYFnm92iq045HTzv26p1QzwhhItaV',
    auto: false,
    landing: "/osm-auth-land.html"
};

let osmAuth = new OSMAuth(osmAuthOptions);

export function* connectToOsmAsync() {
    yield put(setOsmConnectionStatus(OsmConnectionStatus.Connecting));

    yield cps(cb => osmAuth.authenticate(error => cb(error, null)));

    // @Todo cps() error handling

    yield put(setOsmConnectionStatus(OsmConnectionStatus.Connected));

    const details = yield cps(cb => osmAuth.xhr({
            path: '/api/0.6/user/details',
            method: 'GET'
        },
        (error, result) => cb(error, result)));
    
    const u = details.getElementsByTagName('user')[0];
    const username = u.getAttribute('display_name');
    //const userId = u.getAttribute('id'); // @Todo

    yield put(setOsmUserDetails(username));
}

export function* watchConnectFromOsm() {
    yield takeEvery(REQUEST_OSM_CONNECTION, connectToOsmAsync);
}

export function* disconnectFromOsmAsync() {
    osmAuth.logout();

    yield put(setOsmConnectionStatus(OsmConnectionStatus.Disconnected));
}

export function* watchDisconnectFromOsm() {
    yield takeEvery(REQUEST_OSM_DISCONNECTION, disconnectFromOsmAsync);
}

export default function* rootSaga() {
    yield all([
        watchConnectFromOsm(),
        watchDisconnectFromOsm(),
    ]);
}
