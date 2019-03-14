import { combineReducers } from 'redux';
import { mapReducer } from '../reducers';

export const rootReducer = combineReducers({
    map: mapReducer
});

export type AppState = ReturnType<typeof rootReducer>;
