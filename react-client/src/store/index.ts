import { Reducer } from 'redux';
import { initialAppState, mapReducer, osmLoginReducer, sessionReducer, AppState } from '../reducers';
import { RootAction } from '../actions';

export const rootReducer: Reducer<AppState, RootAction> = (state, action): AppState => {
    let newState = state ? state : initialAppState;
    newState = osmLoginReducer(newState, action);
    newState = sessionReducer(newState, action);
    newState = mapReducer(newState, action);
    return newState;
};
