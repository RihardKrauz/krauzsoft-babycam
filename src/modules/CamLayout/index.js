import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Videocam from '@material-ui/icons/VideocamOutlined';
import VideocamOff from '@material-ui/icons/VideocamOffOutlined';
import DirectionsRun from '@material-ui/icons/DirectionsRun';
import IconButton from '@material-ui/core/IconButton';
import Checkbox from '@material-ui/core/Checkbox';

import pixelmatch from 'pixelmatch';

import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';

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
        <div style={{ display: 'flex' }}>
            {/* <h3>Камера: {camName}</h3>
            <Input onChange={e => setCamName(e.target.value)} value={camName} />
             */}
            <div>
                <TextField
                    id="standard-required"
                    label="Камера"
                    value={camName}
                    onChange={e => setCamName(e.target.value)}
                    margin="normal"
                />
            </div>
            <div style={{ marginTop: '1em' }}>
                <Button className={classes.button} onClick={onApply}>
                    Сохранить
                </Button>
            </div>
        </div>
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

const RecordSettings = ({
    isRecording,
    onStartRecord,
    onStopRecord,
    sensivity,
    setSensivityAction,
    setTrackRecordingAction,
    isMoveSpotted,
    isVisible
}) => {
    const containerStyle = Object.assign({ display: 'flex' }, isVisible ? { opacity: '1' } : { opacity: '0' });
    return (
        <div style={containerStyle}>
            <div>
                <TextField
                    id="standard-required"
                    label="Sensivity"
                    style={{ width: '100px' }}
                    value={sensivity}
                    onChange={setSensivityAction}
                    margin="normal"
                />
            </div>
            <div>
                <div
                    style={{
                        fontSize: '12px',
                        color: 'rgba(0, 0, 0, 0.54)',
                        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                        marginTop: '1.3em'
                    }}
                >
                    SaveOnMotion
                </div>
                <Checkbox id="cb-required" onChange={setTrackRecordingAction} margin="normal" />
            </div>
            <div style={{ marginTop: '2.3em', marginLeft: '1em' }}>
                <RecordButton isRecording={isRecording} onStartRecord={onStartRecord} onStopRecord={onStopRecord} />
                {isMoveSpotted && (
                    <IconButton style={{ padding: '0.2em', marginLeft: '0.5em' }} color="primary">
                        <DirectionsRun />
                    </IconButton>
                )}
            </div>
        </div>
    );
};

RecordSettings.propTypes = {
    isRecording: PropTypes.bool,
    onStartRecord: PropTypes.func,
    onStopRecord: PropTypes.func,
    sensivity: PropTypes.any,
    setSensivityAction: PropTypes.func,
    setTrackRecordingAction: PropTypes.func,
    isMoveSpotted: PropTypes.bool,
    isVisible: PropTypes.bool
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
    const [takeSnapshotsInterval, setTakeSnapshotsInterval] = React.useState(null);
    const [isMoveSpotted, setMoveSpotted] = React.useState(false);
    const [moveSensivity, setMoveSensivity] = React.useState(300);
    const [input$, setInputSubject] = React.useState(null);
    const [inputSubscription, setInputSubscription] = React.useState(null);
    const [record$, setRecordSubject] = React.useState(null);
    const [recordSubscription, setRecordSubscription] = React.useState(null);
    const [trackRecordingTimer, setTrackRecordingTimer] = React.useState(null);

    let localVideoEl = React.useRef(null);
    let prevShotCanvas = React.useRef(null);
    let nextShotCanvas = React.useRef(null);
    let diffCanvas = React.useRef(null);

    React.useEffect(() => {
        const _input$ = new Subject();

        setClientId(Math.floor(Math.random() * 1000000000));
        setInputSubject(_input$);
        setInputSubscription(() =>
            _input$
                .pipe(
                    debounceTime(300),
                    distinctUntilChanged()
                )
                .subscribe(trackChanges)
        );

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
            if (inputSubscription) {
                inputSubscription.unsubscribe();
            }
            if (recordSubscription) {
                inputSubscription.unsubscribe();
            }

            firebase.setCamActive(camNo, false);
            if (takeSnapshotsInterval) {
                clearInterval(takeSnapshotsInterval);
            }
            if (trackRecordingTimer) {
                clearInterval(trackRecordingTimer);
            }
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

            const _record$ = new Subject();

            let isTrackRecordingEmitted = false;
            setRecordSubscription(() =>
                _record$
                    .pipe(
                        filter(value => {
                            return isTrackRecordingEmitted === false;
                        })
                    )
                    .subscribe(() => {
                        console.log('Record on move emitted');
                        const recordResult = startRecord(userMediaStream);
                        isTrackRecordingEmitted = true;
                        setTrackRecordingTimer(() =>
                            setTimeout(() => {
                                console.log('Record on move completed');
                                stopRecord(recordResult);
                                isTrackRecordingEmitted = false;
                            }, 3000)
                        );
                    })
            );

            setRecordSubject(_record$);
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
        runTrackingChanges(moveSensivity);
    }

    function stopWatching() {
        unsubscribeEvent(unsubscribeWatcherEvents);
        unsubscribeEvent(unsubscribeMessageEvents);
        if (takeSnapshotsInterval) {
            clearInterval(takeSnapshotsInterval);
        }
        if (recordSubscription) {
            inputSubscription.unsubscribe();
        }

        firebase.setCamActive(camNo, false);

        localVideoEl.current.srcObject = null;
        peerConnection.close();
        setPeerConnection(null);
        setLocalStream(null);
    }

    function changeName() {
        firebase.setCamName(camNo, camName);
    }

    function startRecord(stream, autoChunks) {
        const _stream = stream || localStream;
        let _recorder;
        let _autoChunks = autoChunks || [];
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
            _recorder = new MediaRecorder(_stream, options);
        } catch (e) {
            console.error('Exception while creating MediaRecorder:', e);
            return;
        }

        console.log('Created MediaRecorder', _recorder, 'with options', options);

        _recorder.onstop = event => {
            console.log('Recorder stopped: ', event);
        };
        _recorder.ondataavailable = event => {
            if (event.data && event.data.size > 0) {
                const chunks = autoChunks ? _autoChunks : allChunks;
                chunks.push(event.data);
                _autoChunks.push(event.data);
                setAllChunks(chunks);
            }
        };

        _recorder.start(10); // collect 10ms of data
        console.log('MediaRecorder started', _recorder);

        setRecording(true);
        setRecorder(_recorder);
        return { autoRecorder: _recorder, chunks: _autoChunks };
    }

    function stopRecord(recorderSetup) {
        const currentRecorder = recorderSetup ? recorderSetup.autoRecorder : recorder;
        const currentChunks = recorderSetup ? recorderSetup.chunks : allChunks;
        currentRecorder.stop();
        setRecording(false);
        console.log('Recorded Blobs: ', currentChunks);
        const blob = new Blob(currentChunks, { type: 'video/webm' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const now = new Date();
        a.download = `${camName.replace(/\s/g, '_')}_${now.getHours()}${now.getMinutes()}${now.getSeconds()}.webm`;
        document.body.appendChild(a);
        a.click();
        setRecorder(null);
        setAllChunks([]);
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    }

    function takePrevShot() {
        const lastCanvas = prevShotCanvas.current;
        const lastCtx = lastCanvas.getContext('2d');
        lastCtx.drawImage(localVideoEl.current, 0, 0, lastCanvas.width, lastCanvas.height);
        return lastCtx;
    }

    function runTrackingChanges(sensivity, needRecord) {
        let prevShot = takePrevShot();

        setTakeSnapshotsInterval(() =>
            setInterval(() => {
                const newCanvas = nextShotCanvas.current;
                const newCtx = newCanvas.getContext('2d');
                newCtx.drawImage(localVideoEl.current, 0, 0, newCanvas.width, newCanvas.height);
                const diffPixels = compareShots(prevShot, newCtx);
                if (diffPixels > sensivity) {
                    setMoveSpotted(true);
                    if (needRecord === true) {
                        record$.next(true);
                    }
                } else {
                    setMoveSpotted(false);
                }
                prevShot = takePrevShot();
            }, 1000)
        );
    }

    function setSensivityAction(e) {
        const value = Number(e.target.value ? e.target.value : 0);
        if (isNaN(value)) {
            console.error('Invalid input in sensivity');
            return;
        }

        if (takeSnapshotsInterval) {
            clearInterval(takeSnapshotsInterval);
        }
        setMoveSensivity(value);
        input$.next(value);
    }

    function trackChanges(val) {
        runTrackingChanges(val);
    }

    function compareShots(oldSnapshot, newSnapshot) {
        const diffCtx = diffCanvas.current.getContext('2d');
        const img1 = oldSnapshot.getImageData(0, 0, 640, 480);
        const img2 = newSnapshot.getImageData(0, 0, 640, 480);
        const diff = diffCtx.createImageData(640, 480);
        const diffPixels = pixelmatch(img1.data, img2.data, diff.data, 640, 480, { threshold: 0.3 });

        diffCtx.putImageData(diff, 0, 0);
        return diffPixels;
    }

    return (
        <div className={classes.container}>
            <CameraNamePanel camName={camName} setCamName={setCamName} onApply={changeName} classes={classes} />
            <div className={classes.actionContainer}>
                <div>
                    <Button variant="outlined" color="primary" className={classes.actionButton} onClick={startWatching}>
                        Start
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        className={classes.actionButton}
                        onClick={stopWatching}
                    >
                        Stop
                    </Button>
                </div>
                <RecordSettings
                    isRecording={isRecording}
                    onStartRecord={() => startRecord()}
                    onStopRecord={() => stopRecord()}
                    sensivity={moveSensivity}
                    setSensivityAction={setSensivityAction}
                    isMoveSpotted={isMoveSpotted}
                    isVisible={!!peerConnection}
                    setTrackRecordingAction={e => {
                        const value = e.target.checked;
                        if (takeSnapshotsInterval) {
                            clearInterval(takeSnapshotsInterval);
                        }
                        runTrackingChanges(moveSensivity, value);
                    }}
                />
            </div>
            <video className={classes.video} playsInline autoPlay muted ref={localVideoEl} />

            <section style={{ display: 'none' }}>
                <canvas className={classes.video} ref={prevShotCanvas} />
                <canvas className={classes.video} ref={nextShotCanvas} />
                <canvas className={classes.video} ref={diffCanvas} />
            </section>
        </div>
    );
};

CamLayout.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(CamLayout);
