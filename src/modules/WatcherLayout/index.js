import React from 'react';
import { useCurrentUser } from '../../services/custom-hooks';

const WatcherLayout = ({ firebase, rtcClient }) => {
    const currentUser = useCurrentUser(firebase.auth);
    let remoteVideoEl = React.useRef(null);
    let peerConnection;
    let camId = '';
    let activeCams = [];
    let others;
    let unsubscribeMessageEvents;
    const clientId = Math.floor(Math.random() * 1000000000);

    React.useEffect(() => {
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

        [camId, ...others] = await firebase.getActiveCamIdsByOwnerKey(currentUser.email);

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
    }

    function stopWatching() {
        unsubscribeEvent(unsubscribeMessageEvents);

        peerConnection.close();
        peerConnection = null;
    }

    return (
        <div style={{ width: '400px', height: '400px' }}>
            <h3>Watcher {currentUser.email}</h3>
            <video style={{ width: '300px', height: '200px' }} playsInline muted autoPlay ref={remoteVideoEl} />
            <button onClick={watchCam}>Start</button>
            <button onClick={stopWatching}>Stop</button>
        </div>
    );
};

export default WatcherLayout;
