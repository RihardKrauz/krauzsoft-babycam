import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';

const styles = () => ({
    button: {
        margin: '1em'
    },
    container: {
        margin: '1em'
    },
    video: { width: '90%', margin: '1em' },
    actionContainer: {
        marginTop: '1em',
        marginBottom: '1em'
    },
    actionButton: {
        marginRight: '1em'
    }
});

const CamLayout = ({ firebase, match, rtcClient, classes }) => {
    const [camNo, setCamNo] = React.useState('');
    const [camName, setCamName] = React.useState('');

    let peerConnection;
    let localVideoEl = React.useRef(null);
    let unsubscribeWatcherEvents;
    let unsubscribeMessageEvents;
    const clientId = Math.floor(Math.random() * 1000000000);

    React.useEffect(() => {
        (async () => {
            const camId = match.params.id;
            if (camId) {
                setCamNo(camId);
                const name = await firebase.getCamName(camId);
                setCamName(name);
                firebase.setCamActive(camId, false);
            }
        })();

        return () => {
            unsubscribeEvent(unsubscribeWatcherEvents);
            unsubscribeEvent(unsubscribeMessageEvents);

            firebase.setCamActive(camNo, false);
        };
    }, []);

    function unsubscribeEvent(evt) {
        if (evt instanceof Function) {
            evt();
        }
    }

    async function startWatching() {
        peerConnection = new RTCPeerConnection();
        peerConnection.onicecandidate = async event =>
            event.candidate
                ? await rtcClient.sendMessage(clientId, camNo, JSON.stringify({ ice: event.candidate }), console.error)
                : console.log('Sent All Ice');

        const userMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (userMediaStream) {
            localVideoEl.current.srcObject = userMediaStream;
            peerConnection.addStream(userMediaStream);
        }

        unsubscribeWatcherEvents = firebase.getCamWatchers(camNo).onSnapshot(snapshot => {
            snapshot.docChanges().forEach(async change => {
                if (change.type === 'added') {
                    console.log('Send watcher...', change.doc.data());
                    await rtcClient.setLocalDescriptionAndSendMessage(peerConnection, clientId, camNo);
                }
                change.doc.ref.delete();
            });
        });

        unsubscribeMessageEvents = firebase.getCamMessages(camNo).onSnapshot(snapshot => {
            snapshot.docChanges().forEach(async change => {
                if (change.type === 'added') {
                    console.log('Recieved msg...', change.doc.data());
                    await rtcClient.readMessage(peerConnection, clientId, camNo, change.doc.data());
                }
            });
        });

        firebase.setCamActive(camNo, true);
    }

    function stopWatching() {
        unsubscribeEvent(unsubscribeWatcherEvents);
        unsubscribeEvent(unsubscribeMessageEvents);
        firebase.setCamActive(camNo, false);

        localVideoEl.current.srcObject = null;
        peerConnection.close();
        peerConnection = null;
    }

    function changeName() {
        firebase.setCamName(camNo, camName);
    }

    return (
        <div className={classes.container}>
            <h3>Камера: {camName}</h3>
            <Input onChange={e => setCamName(e.target.value)} value={camName} />
            <Button className={classes.button} onClick={changeName}>
                Сохранить
            </Button>
            <div className={classes.actionContainer}>
                <Button variant="outlined" color="primary" className={classes.actionButton} onClick={startWatching}>
                    Start
                </Button>
                <Button variant="outlined" color="secondary" className={classes.actionButton} onClick={stopWatching}>
                    Stop
                </Button>
            </div>
            <video className={classes.video} playsInline autoPlay muted ref={localVideoEl} />
        </div>
    );
};

CamLayout.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(CamLayout);
