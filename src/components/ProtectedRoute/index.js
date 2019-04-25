import React from 'react';
import { PropTypes } from 'prop-types';
import { Route, Redirect } from 'react-router-dom';

export default function ProtectedRoute({ component: Component, auth, ...rest }) {
    const [isAuthenticated, setAuthenticated] = React.useState(true);

    React.useEffect(() => {
        auth.onAuthStateChanged(user => {
            if (user) {
                setAuthenticated(true);
            } else {
                setAuthenticated(false);
            }
        });
        return () => {
            auth.onAuthStateChanged = () => {};
        };
    }, []);

    return (
        <Route
            {...rest}
            render={props =>
                isAuthenticated ? (
                    <Component {...props} />
                ) : (
                    <Redirect to={{ pathname: '/login', state: { from: props.location } }} />
                )
            }
        />
    );
}

ProtectedRoute.propTypes = {
    component: PropTypes.func,
    location: PropTypes.object,
    auth: PropTypes.object
};
