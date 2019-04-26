import { useState, useEffect } from 'react';

const useCurrentUser = (authService, callback) => {
    const [currentUser, setCurrentUser] = useState({ name: '', email: '' });

    const mapFirebaseUser = ({ displayName, email }) => ({ name: displayName, email });

    const setUserForStateAndInitCallbackAction = user => {
        setCurrentUser(mapFirebaseUser(user));
        if (callback instanceof Function) {
            callback.call(this, user);
        }
    };

    useEffect(() => {
        if (authService.currentUser) {
            setUserForStateAndInitCallbackAction(authService.currentUser);
            return () => {};
        }
        authService.onAuthStateChanged(user => {
            if (user && user.email) {
                setUserForStateAndInitCallbackAction(user);
            } else {
                setCurrentUser('');
            }
        });
        return () => {
            authService.onAuthStateChanged = () => {};
        };
    }, []);

    return currentUser;
};

export { useCurrentUser };
