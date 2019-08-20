import { combineReducers } from 'redux';
import { mapReducer, osmLoginReducer, sessionReducer } from '../reducers';

export const rootReducer = combineReducers({
    map: mapReducer,
    osmLogin: osmLoginReducer,
    session: sessionReducer
});

export type AppState = ReturnType<typeof rootReducer>;
