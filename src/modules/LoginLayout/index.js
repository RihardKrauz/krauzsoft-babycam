import React from 'react';
import { useCurrentUser } from '../../services/custom-hooks';

const LoginLayout = ({ history, firebase }) => {
    const currentUser = useCurrentUser(firebase.auth);

    async function signInWithGoogle() {
        const authResult = await firebase.auth.signInWithPopup(firebase.authProvider);
        if (authResult && authResult.user) {
            await firebase.addUserIfNotExists({ name: authResult.user.displayName, email: authResult.user.email });
            redirectToMode();
        }
    }

    function redirectToMode() {
        history.push('/mode');
    }

    function signOut() {
        firebase.auth.signOut();
    }

    return (
        <>
            <button onClick={signOut}>Logoff</button>
            {currentUser.email ? (
                <button onClick={redirectToMode}>Continue as {currentUser.name}</button>
            ) : (
                <button onClick={signInWithGoogle}>Login with Google</button>
            )}
        </>
    );
};

export default LoginLayout;
