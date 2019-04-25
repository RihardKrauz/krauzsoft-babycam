import React, { Component } from 'react';
import './App.css';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
import { withFirebaseContext, FirebaseContext } from '../Firebase';
import RTCMessenger, { withRTCContext, RTCContext } from '../RTCMessenger';
import AppHeader from '../AppHeader';
import ProtectedRoute from '../ProtectedRoute';
import LoginLayout from '../../modules/LoginLayout';
import ModeLayout from '../../modules/ModeLayout';
import CamLayout from '../../modules/CamLayout';
import WatcherLayout from '../../modules/WatcherLayout';
import CamCreatingLayout from '../../modules/CamCreatingLayout';

class App extends Component {
    render() {
        return (
            <FirebaseContext.Consumer>
                {firebase => (
                    <>
                        <AppHeader />
                        <RTCContext.Provider value={new RTCMessenger(firebase)}>
                            <BrowserRouter>
                                <Switch>
                                    <Redirect exact from="/" to="login" />
                                    <Route path="/login" component={withFirebaseContext(LoginLayout)} />
                                    <ProtectedRoute
                                        auth={firebase.auth}
                                        path="/mode"
                                        component={withFirebaseContext(ModeLayout)}
                                    />
                                    <ProtectedRoute
                                        exact
                                        auth={firebase.auth}
                                        path="/cam"
                                        component={withFirebaseContext(CamCreatingLayout)}
                                    />
                                    <ProtectedRoute
                                        auth={firebase.auth}
                                        path="/cam/:id"
                                        component={withRTCContext(withFirebaseContext(CamLayout))}
                                    />
                                    <ProtectedRoute
                                        auth={firebase.auth}
                                        path="/watcher"
                                        component={withRTCContext(withFirebaseContext(WatcherLayout))}
                                    />
                                </Switch>
                            </BrowserRouter>
                        </RTCContext.Provider>
                    </>
                )}
            </FirebaseContext.Consumer>
        );
    }
}

export default App;
