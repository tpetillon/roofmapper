import { combineReducers } from 'redux';
import { StateType } from 'typesafe-actions';
import { mapReducer, osmLoginReducer, sessionReducer } from '../reducers';

export const rootReducer = combineReducers({
    map: mapReducer,
    osmLogin: osmLoginReducer,
    session: sessionReducer
});

export type AppState = StateType<typeof rootReducer>;
