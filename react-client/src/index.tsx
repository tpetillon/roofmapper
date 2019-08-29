import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import createSagaMiddleware from 'redux-saga'

import { Layout } from 'antd';
import { Row, Col } from 'antd';

import * as serviceWorker from './serviceWorker';
import { rootReducer } from './store';
import { rootSaga } from './sagas';
import { MapContainer } from './components/MapContainer';
import { OsmLoginContainer } from './components/OsmLogin';
import { SessionContainer } from './components/Session';
import { NavigationButtonsContainer } from './components/NavigationButtons';

import './index.css';

const sagaMiddleware = createSagaMiddleware();
const store = createStore(
    rootReducer,
    applyMiddleware(sagaMiddleware));
sagaMiddleware.run(rootSaga);

ReactDOM.render(
    <Provider store={store}>
        <Layout style={{height:"100vh"}}>
            <Layout>
                <Row>
                    <Col span={12}>
                        <OsmLoginContainer/>
                    </Col>
                    <Col span={12}>
                        <SessionContainer/>
                    </Col>
                </Row>
            </Layout>
            <Layout>
                <MapContainer/>
            </Layout>
            <Layout>
                <NavigationButtonsContainer/>
            </Layout>
        </Layout>
    </Provider>,
    document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
