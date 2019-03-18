import { combineReducers } from 'redux';
import { mapReducer, osmLoginReducer } from '../reducers';

export const rootReducer = combineReducers({
    map: mapReducer,
    osmLogin: osmLoginReducer
});

export type AppState = ReturnType<typeof rootReducer>;
