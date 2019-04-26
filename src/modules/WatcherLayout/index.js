import React from 'react';
import PropTypes from 'prop-types';
import { useCurrentUser } from '../../services/custom-hooks';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

const styles = () => ({
    button: {
        margin: '1em'
    }
});

const CamWatcher = ({ firebase, rtcClient, camId, currentUser }) => {
    const [camName, setCamName] = React.useState('');
    const [fullsize, setFullsize] = React.useState(false);
    const [isCamActive, setCamActive] = React.useState(false);

    let remoteVideoEl = React.useRef(null);
    let peerConnection;
    let unsubscribeMessageEvents;
    const clientId = Math.floor(Math.random() * 1000000000);

    React.useEffect(() => {
        (async () => {
            if (camId) {
                const name = await firebase.getCamName(camId);
                setCamName(name);
            }
        })();

        return () => {
            unsubscribeEvent(unsubscribeMessageEvents);
        };
    }, []);

    function unsubscribeEvent(evt) {
        if (evt instanceof Function) {
            evt();
        }
    }

    async function watchCam() {
        peerConnection = new RTCPeerConnection();
        peerConnection.onicecandidate = async event =>
            event.candidate
                ? await rtcClient.sendMessage(clientId, camId, JSON.stringify({ ice: event.candidate }), console.error)
                : console.log('Sent All Ice');
        peerConnection.onaddstream = event => {
            console.log(event);
            remoteVideoEl.current.srcObject = event.stream;
        };

        unsubscribeMessageEvents = firebase.getCamMessages(camId).onSnapshot(snapshot => {
            snapshot.docChanges().forEach(async change => {
                if (change.type === 'added') {
                    console.log('Recieved msg...', change.doc.data());
                    await rtcClient.readMessage(peerConnection, clientId, camId, change.doc.data());
                }
            });
        });

        firebase
            .getCamWatchers(camId)
            .add({ watcherId: currentUser.email })
            .catch(console.error);

        setCamActive(true);
    }

    function stopWatching() {
        try {
            setCamActive(false);
            unsubscribeEvent(unsubscribeMessageEvents);

            peerConnection.close();
            peerConnection = null;
        } catch (ex) {
            console.error(ex);
        }
    }

    function openFullscreen() {
        setFullsize(true);
    }

    function closeFullscreen() {
        setFullsize(false);
    }

    return (
        <div style={{ width: '400px', height: '400px', margin: '0.4em' }}>
            <h3>Camera {camName}</h3>
            <div>
                <Button onClick={watchCam}>Start</Button>
                <Button onClick={stopWatching}>Stop</Button>
                <Button className={`fullscreen-btn ${isCamActive ? '' : 'hidden'}`} onClick={openFullscreen}>
                    Fullscreen
                </Button>
            </div>
            <div className={`close-fs-btn ${fullsize ? 'fullscreen' : ''}`}>
                <Button variant="contained" color="secondary" onClick={closeFullscreen}>
                    Close
                </Button>
            </div>
            <div className={`cam-view ${fullsize ? 'fullscreen' : ''}`}>
                <video style={{ width: '100%' }} playsInline muted autoPlay ref={remoteVideoEl} />
            </div>
            <style>
                {`.hidden {display:none;}
                .close-fs-btn {display:none;}
                .close-fs-btn.fullscreen{
                    display: block;
                    z-index: 9999;
                    position: fixed;
                    top: 10px;
                    left: 10px;
                }
                .cam-view.fullscreen {
                    position: absolute;
                    top: 4px;
                    left: 4px;
                    width: calc(100% - 8px);
                }`}
            </style>
        </div>
    );
};

CamWatcher.propTypes = {
    camId: PropTypes.string.isRequired,
    currentUser: PropTypes.object.isRequired
};

const WatcherLayout = ({ firebase, rtcClient, classes }) => {
    const [cams, setCams] = React.useState([]);
    const currentUser = useCurrentUser(firebase.auth, user => {
        useActiveCams(user);
    });

    const useActiveCams = async u => {
        const activeCams = await firebase.getActiveCamIdsByOwnerKey(u.email);
        setCams(activeCams);
    };

    return (
        <div style={{ margin: '1em' }}>
            <h3>Watcher: {currentUser.email}</h3>
            <Button onClick={() => useActiveCams(currentUser)}>Обновить</Button>
            <Button onClick={async () => await firebase.closeAllCamsByWatcherId(currentUser.email)}>
                Закрыть все камеры
            </Button>
            <div className="cam-container">
                {cams.map(cam => (
                    <CamWatcher
                        key={cam}
                        firebase={firebase}
                        rtcClient={rtcClient}
                        camId={cam}
                        currentUser={currentUser}
                    />
                ))}
            </div>
            <style>
                {`
                    @media (min-width: 600px) {
                    .cam-container { display: flex; }
                }`}
            </style>
        </div>
    );
};

WatcherLayout.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(WatcherLayout);
