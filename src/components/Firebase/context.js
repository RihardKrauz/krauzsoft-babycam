import React from 'react';

const FirebaseContext = React.createContext(null);

/* eslint react/display-name: 0 */
export const withFirebaseContext = Component => props => (
    <FirebaseContext.Consumer>{firebase => <Component {...props} firebase={firebase} />}</FirebaseContext.Consumer>
);

export default FirebaseContext;
