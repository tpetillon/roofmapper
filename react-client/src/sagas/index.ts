import { all, call, cancel, cps, fork, put, take, select } from 'redux-saga/effects';
import { getType } from 'typesafe-actions';
import OSMAuth from 'osm-auth';
import * as actions from '../actions';
import { OsmLoginStatus } from '../reducers';
import * as selectors from '../selectors';
import { BuildingService } from './BuildingService';
import { Building, setBuildingData } from '../reducers/Building';
import { SessionStatus } from '../reducers/Session';
import { version as roofmapperVersion } from '../../package.json'

function* loginToOsm(osmAuth: OSMAuth.OSMAuthInstance) {
    try {
        yield put(actions.setOsmLoginStatus(OsmLoginStatus.LoggingIn));

        yield cps(cb => osmAuth.authenticate(error => cb(error, null)));

        yield put(actions.setOsmLoginStatus(OsmLoginStatus.FetchingDetails));

        const details: XMLDocument = yield cps(cb => osmAuth.xhr({
                path: '/api/0.6/user/details',
                method: 'GET'
            },
            (error, result) => cb(error, result)));
        
        const u = details.getElementsByTagName('user')[0];
        const username = u.getAttribute('display_name') || '';
        const userId = u.getAttribute('id') || '';

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

    yield fork(fetchBuildings, osmAuth);
    yield fork(changesetFlow, osmAuth);
}

function fetchBuildingData(building: Building, osmAuth: OSMAuth.OSMAuthInstance) {
    return cps(cb => osmAuth.xhr({
            path: '/api/0.6/' + building.type + '/' + building.id + '/full',
            method: 'GET'
        },
        (error, result) => cb(error, result)));
}

function* fetchBuilding(osmAuth: OSMAuth.OSMAuthInstance) {
    const sessionId: ReturnType<typeof selectors.sessionId> = yield select(selectors.sessionId);

    if (!sessionId) {
        throw new Error('No open session');
    }

    const building: Building = yield BuildingService.getBuilding(sessionId);
    const buildingData: XMLDocument = yield fetchBuildingData(building, osmAuth);

    if (setBuildingData(building, buildingData)) {
        yield put(actions.addBuilding(building));
        yield put(actions.selectLastBuilding());

        return true;
    } else {
        // @Todo Invalidate building
        return false;
    }
}

function* fetchBuildings(osmAuth: OSMAuth.OSMAuthInstance) {
    while (true) {
        let success = false;
        do {
            success = yield call(fetchBuilding, osmAuth);
        } while (!success);
        yield take(getType(actions.requestBuilding));
    }
}

function* changesetFlow(osmAuth: OSMAuth.OSMAuthInstance) {
    while (true) {
        yield take(getType(actions.uploadTags));

        const changesetId = yield select(selectors.changesetId);
        if (!changesetId) {
            yield call(openChangeset, osmAuth);
        }

        yield call(uploadData, osmAuth);
        yield put(actions.clearTaggedBuildings());
        yield put(actions.requestBuilding());
    }
}

function* openChangeset(osmAuth: OSMAuth.OSMAuthInstance) {
    // @Todo Sources
    const changesetCreationData =
        `<osm>
        <changeset>
        <tag k="created_by" v="RoofMapper ${roofmapperVersion}"/>
        <tag k="comment" v="Add building roof:material data from imagery"/>
        <tag k="source" v=""/>
        </changeset>
        </osm>`;
    
    try {
        const response: string = yield cps(cb => osmAuth.xhr({
                path: '/api/0.6/changeset/create',
                method: 'PUT',
                options: {
                    header: {
                        'Content-Type': 'application/xml; charset="utf-8"'
                    }
                },
                content: changesetCreationData
            },
            (error, result) => cb(error, result)));
        const changesetId = parseInt(response);
        yield put(actions.setChangesetId(changesetId));
    } catch (error) {
        const errorMessage = (error.responseText ? error.responseText : error);
        throw new Error(`Could not open changeset: ${errorMessage}`);
    }
}

function* uploadData(osmAuth: OSMAuth.OSMAuthInstance): Iterable<any> {
    const sessionId = yield select(selectors.sessionId);
    const changesetId = yield select(selectors.changesetId);
    const changesetData = yield select(selectors.sessionOsmChange);
    const tagData: any = yield select(selectors.sessionTagData);

    if (!sessionId || !changesetData || !changesetData || !tagData) {
        throw new Error('Session is not ready for upload');
    }

    try {
        yield cps(cb => osmAuth.xhr({
                path: `/api/0.6/changeset/${changesetId}/upload`,
                method: 'POST',
                options: {
                    header: {
                        'Content-Type': 'application/xml; charset="utf-8"'
                    }
                },
                content: changesetData
            },
            (error, result) => cb(error, result)));

        yield call(BuildingService.tagBuildings, sessionId, tagData);
        yield put(actions.addUploadedBuildingCount(tagData.tag_data.length));
        // @Todo Invalidate buildings
    } catch (error) {
        if (error.statusText === 'Conflict') {
            if (error.responseText.match(/was closed/)) {
                // The changeset #id was closed at #closed_at.
                yield call(openChangeset, osmAuth);
                yield call(uploadData, osmAuth);
            } else if (error.responseText.match(/Version mismatch/)) {
                // Version mismatch: Provided #ver_client, server had: #ver_serv of [Way|Relation] #id
                // @Todo Remove building in conflict
                yield call(uploadData, osmAuth);
            }
        } else {
            const errorMessage = (error.responseText ? error.responseText : error);
            throw new Error(`Could not upload data: ${errorMessage}`);
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
