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

const CamCreatingLayout = ({ history, firebase, classes }) => {
    const currentUser = useCurrentUser(firebase.auth, async user => {
        await createCamAndRedirect(user);
    });

    const createCamAndRedirect = async ({ email }) => {
        const cam = await firebase.createCam({ email });
        history.push(`/cam/${cam.id}`);
    };

    const checkCurrentUserAndRunAction = () => {
        (async () => {
            if (firebase.auth.currentUser) {
                await createCamAndRedirect(firebase.auth.currentUser);
            }
        })();
    };

    return (
        <div>
            <h2>Создаем камеру для {currentUser.name}...</h2>
            <Button variant="outlined" className={classes.button} onClick={checkCurrentUserAndRunAction}>
                Создать вручную
            </Button>
        </div>
    );
};

CamCreatingLayout.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(CamCreatingLayout);
