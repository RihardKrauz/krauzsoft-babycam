import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import Videocam from '@material-ui/icons/VideocamOutlined';
import VideocamOff from '@material-ui/icons/VideocamOffOutlined';
import IconButton from '@material-ui/core/IconButton';

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

const CameraNamePanel = ({ camName, setCamName, onApply, classes }) => {
    return (
        <>
            <h3>Камера: {camName}</h3>
            <Input onChange={e => setCamName(e.target.value)} value={camName} />
            <Button className={classes.button} onClick={onApply}>
                Сохранить
            </Button>
        </>
    );
};

CameraNamePanel.propTypes = {
    camName: PropTypes.string,
    setCamName: PropTypes.func,
    onApply: PropTypes.func,
    classes: PropTypes.object
};

const RecordButton = ({ isRecording, onStartRecord, onStopRecord }) => {
    return !isRecording ? (
        <IconButton style={{ padding: '0.2em' }} color="default" onClick={onStartRecord}>
            <VideocamOff />
        </IconButton>
    ) : (
        <IconButton style={{ padding: '0.2em' }} color="secondary" onClick={onStopRecord}>
            <Videocam />
        </IconButton>
    );
};

RecordButton.propTypes = {
    isRecording: PropTypes.bool,
    onStartRecord: PropTypes.func,
    onStopRecord: PropTypes.func
};

const CamLayout = ({ firebase, match, rtcClient, classes }) => {
    const [camNo, setCamNo] = React.useState('');
    const [camName, setCamName] = React.useState('');
    const [isRecording, setRecording] = React.useState(false);
    const [peerConnection, setPeerConnection] = React.useState(null);
    const [recorder, setRecorder] = React.useState(null);
    const [localStream, setLocalStream] = React.useState(null);
    const [clientId, setClientId] = React.useState(0);
    const [unsubscribeWatcherEvents, setUnsubscribeWatcherEvents] = React.useState(null);
    const [unsubscribeMessageEvents, setUnsubscribeMessageEvents] = React.useState(null);
    const [allChunks, setAllChunks] = React.useState([]);

    let localVideoEl = React.useRef(null);

    React.useEffect(() => {
        setClientId(Math.floor(Math.random() * 1000000000));

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
        const _peerConnection = new RTCPeerConnection();
        setPeerConnection(new RTCPeerConnection());
        _peerConnection.onicecandidate = async event =>
            event.candidate
                ? await rtcClient.sendMessage(clientId, camNo, JSON.stringify({ ice: event.candidate }), console.error)
                : console.log('Sent All Ice');

        const userMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (userMediaStream) {
            localVideoEl.current.srcObject = userMediaStream;
            setLocalStream(userMediaStream);
            _peerConnection.addStream(userMediaStream);
        }

        setUnsubscribeWatcherEvents(() =>
            firebase.getCamWatchers(camNo).onSnapshot(snapshot => {
                snapshot.docChanges().forEach(async change => {
                    if (change.type === 'added') {
                        console.log('Send watcher...', change.doc.data());
                        await rtcClient.setLocalDescriptionAndSendMessage(_peerConnection, clientId, camNo);
                    }
                    change.doc.ref.delete();
                });
            })
        );

        setUnsubscribeMessageEvents(() =>
            firebase.getCamMessages(camNo).onSnapshot(snapshot => {
                snapshot.docChanges().forEach(async change => {
                    if (change.type === 'added') {
                        console.log('Recieved msg...', change.doc.data());
                        await rtcClient.readMessage(_peerConnection, clientId, camNo, change.doc.data());
                    }
                });
            })
        );

        firebase.setCamActive(camNo, true);
        setPeerConnection(_peerConnection);
    }

    function stopWatching() {
        unsubscribeEvent(unsubscribeWatcherEvents);
        unsubscribeEvent(unsubscribeMessageEvents);
        firebase.setCamActive(camNo, false);

        localVideoEl.current.srcObject = null;
        peerConnection.close();
        setPeerConnection(null);
        setLocalStream(null);
    }

    function changeName() {
        firebase.setCamName(camNo, camName);
    }

    function startRecord() {
        let _recorder;
        let options = { mimeType: 'video/webm;codecs=vp9' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.error(`${options.mimeType} is not Supported`);
            options = { mimeType: 'video/webm;codecs=vp8' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.error(`${options.mimeType} is not Supported`);
                options = { mimeType: 'video/webm' };
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    console.error(`${options.mimeType} is not Supported`);
                    options = { mimeType: '' };
                }
            }
        }

        try {
            _recorder = new MediaRecorder(localStream, options);
        } catch (e) {
            console.error('Exception while creating MediaRecorder:', e);
            return;
        }

        console.log('Created MediaRecorder', _recorder, 'with options', options);

        _recorder.onstop = event => {
            console.log('Recorder stopped: ', event);
        };
        _recorder.ondataavailable = handleRecordDataAvailable;
        _recorder.start(10); // collect 10ms of data
        console.log('MediaRecorder started', _recorder);

        setRecording(true);
        setRecorder(_recorder);
    }

    function handleRecordDataAvailable(event) {
        if (event.data && event.data.size > 0) {
            const chunks = allChunks;
            chunks.push(event.data);
            setAllChunks(chunks);
        }
    }

    function stopRecord() {
        recorder.stop();
        setRecording(false);
        console.log('Recorded Blobs: ', allChunks);
        const blob = new Blob(allChunks, { type: 'video/webm' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const now = new Date();
        a.download = `camName_${now.getHours()}${now.getMinutes()}.webm`;
        document.body.appendChild(a);
        a.click();
        setRecorder(null);
        setAllChunks([]);
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    }

    return (
        <div className={classes.container}>
            <CameraNamePanel camName={camName} setCamName={setCamName} onApply={changeName} classes={classes} />
            <div className={classes.actionContainer}>
                <Button variant="outlined" color="primary" className={classes.actionButton} onClick={startWatching}>
                    Start
                </Button>
                <Button variant="outlined" color="secondary" className={classes.actionButton} onClick={stopWatching}>
                    Stop
                </Button>
                {peerConnection && (
                    <RecordButton isRecording={isRecording} onStartRecord={startRecord} onStopRecord={stopRecord} />
                )}
            </div>
            <video className={classes.video} playsInline autoPlay muted ref={localVideoEl} />
        </div>
    );
};

CamLayout.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(CamLayout);
