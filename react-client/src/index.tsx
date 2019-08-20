import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import createSagaMiddleware from 'redux-saga'

import * as serviceWorker from './serviceWorker';
import { rootReducer } from './store';
import { rootSaga } from './sagas';
import { MapContainer } from './components/MapContainer';
import { OsmLoginContainer } from './components/OsmLogin';
import { SessionContainer } from './components/Session';

import './index.css';

const sagaMiddleware = createSagaMiddleware();
const store = createStore(
    rootReducer,
    applyMiddleware(sagaMiddleware));
sagaMiddleware.run(rootSaga);

ReactDOM.render(
    <Provider store={store}>
        <MapContainer/>
        <OsmLoginContainer/>
        <SessionContainer/>
    </Provider>,
    document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
