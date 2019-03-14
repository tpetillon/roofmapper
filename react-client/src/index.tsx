import React from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { rootReducer } from './store';
import MapContainer from './components/MapContainer';
import * as serviceWorker from './serviceWorker';
import './index.css';

const store = createStore(rootReducer);

ReactDOM.render(
    <Provider store={store}>
        <MapContainer/>
    </Provider>,
    document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
