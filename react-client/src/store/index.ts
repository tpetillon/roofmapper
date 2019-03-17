import { combineReducers } from 'redux';
import { mapReducer, osmConnectionReducer } from '../reducers';

export const rootReducer = combineReducers({
    map: mapReducer,
    osmConnection: osmConnectionReducer
});

export type AppState = ReturnType<typeof rootReducer>;
