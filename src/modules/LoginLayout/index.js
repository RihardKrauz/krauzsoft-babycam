import React from 'react';
import { useCurrentUser } from '../../services/custom-hooks';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

const styles = () => ({
    button: {
        margin: '1em'
    }
});

const LoginLayout = ({ history, firebase, classes }) => {
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
            {currentUser.email ? (
                <div>
                    <Button variant="outlined" color="primary" className={classes.button} onClick={redirectToMode}>
                        Continue as {currentUser.name}
                    </Button>
                    <Button variant="outlined" className={classes.button} onClick={signOut}>
                        Logoff
                    </Button>
                </div>
            ) : (
                <div>
                    <Button variant="outlined" color="primary" className={classes.button} onClick={signInWithGoogle}>
                        Login with Google
                    </Button>
                </div>
            )}
        </>
    );
};

LoginLayout.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(LoginLayout);
