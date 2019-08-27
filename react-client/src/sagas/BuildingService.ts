import { Building, BuildingType, BuildingTypeFromString } from "../reducers/Building";

const SERVER_URL: string = 'http://lan.dev.roofmapper.eu:3000';

export class BuildingService {
    static openSession(userId: string) {
        const body = { user_id: userId };
        return fetch(SERVER_URL + '/sessions/open', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                })
            .then(data => data.json())
            .then(json => json.session_token as string);
    }

    static closeSession(sessionId: string) {
        return fetch(SERVER_URL + '/sessions/' + sessionId + '/close', {
            method: 'PUT'
        });
    }

    static getBuilding(sessionId: string) {
        return fetch(SERVER_URL + '/sessions/' + sessionId + '/buildings/reserve', {
                    method: 'PUT'
                })
            .then(data => data.json())
            .then(json => {
                const buildingType = BuildingTypeFromString(json.type);
                if (!buildingType) {
                    throw 'Invalid building type: ' + buildingType;
                }

                const buildingId = Number(json.id);
                const buildingVersion = Number(json.version);

                return new Building(buildingType, buildingId, buildingVersion);
            });
    }

    static releaseBuilding(sessionId: string, buildingType: BuildingType, buildingId: number) {
        return fetch(SERVER_URL + '/sessions/' + sessionId + '/buildings/' + buildingType + '/' + buildingId + '/release', {
            method: 'PUT'
        });
    }

    // @Todo Type `tagData`
    static tagBuildings(sessionId: string, tagData: any) {
        return fetch(SERVER_URL + '/sessions/' + sessionId + '/buildings/tag', {
            method: 'POST',
            headers: {
                contentType: 'application/json'
            },
            body: JSON.stringify(tagData)
        });
    }
    
    // @Todo Type `invalidationData`
    static invalidateBuildings(sessionId: string, invalidationData: any) {
        return fetch(SERVER_URL + '/sessions/' + sessionId + '/buildings/invalidate', {
            method: 'POST',
            headers: {
                contentType: 'application/json'
            },
            body: JSON.stringify(invalidationData)
        });
    }

    static fetchTopUsersStats() {
        return fetch(SERVER_URL + '/stats/top');
    }

    static fetchUserStats(userId: string) {
        return fetch(SERVER_URL + '/stats/users/' + userId);
    }
}