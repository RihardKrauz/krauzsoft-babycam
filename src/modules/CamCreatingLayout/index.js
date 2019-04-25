import React from 'react';
import { useCurrentUser } from '../../services/custom-hooks';

const CamCreatingLayout = ({ history, firebase }) => {
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
            Creating a cam for {currentUser.name}...<button onClick={checkCurrentUserAndRunAction}>create</button>
        </div>
    );
};

export default CamCreatingLayout;
