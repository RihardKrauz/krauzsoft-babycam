import React from 'react';

const CamLayout = ({ firebase, match, rtcClient }) => {
    const [camNo, setCamNo] = React.useState('');

    let peerConnection;
    let localVideoEl = React.useRef(null);
    let unsubscribeWatcherEvents;
    let unsubscribeMessageEvents;
    const clientId = Math.floor(Math.random() * 1000000000);

    React.useEffect(() => {
        const camId = match.params.id;
        if (camId) {
            setCamNo(camId);
            firebase.setCamActive(camId, false);
        }

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

    return (
        <div style={{ width: '400px', height: '400px' }}>
            <h3>Cam {camNo}</h3>
            <video style={{ width: '300px', height: '200px' }} playsInline autoPlay muted ref={localVideoEl} />
            <button onClick={startWatching}>Start</button>
            <button onClick={stopWatching}>Stop</button>
        </div>
    );
};

export default CamLayout;
