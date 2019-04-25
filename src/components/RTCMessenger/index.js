import React from 'react';

export const RTCContext = new React.createContext(null);

/* eslint react/display-name: 0 */
export const withRTCContext = Component => props => {
    return <RTCContext.Consumer>{client => <Component rtcClient={client} {...props} />}</RTCContext.Consumer>;
};

export default class RTCMessenger {
    constructor(firebase) {
        this.firebase = firebase;
    }

    async sendMessage(sender, camId, data, onError) {
        var msg = await this.firebase
            .getCamMessages(camId)
            .add({ sender, message: data })
            .catch(onError);
        await this.firebase
            .getCamMessages(camId)
            .doc(msg.id)
            .delete()
            .catch(onError);
    }

    async readMessage(pc, clientId, camId, { sender, message }) {
        var parsedMessage = JSON.parse(message);
        if (sender !== clientId) {
            if (parsedMessage.ice) {
                pc.addIceCandidate(new RTCIceCandidate(parsedMessage.ice));
            } else if (parsedMessage.sdp.type === 'offer') {
                pc.setRemoteDescription(new RTCSessionDescription(parsedMessage.sdp));
                const answer = await pc.createAnswer();
                pc.setLocalDescription(answer);
                await this.sendMessage(clientId, camId, JSON.stringify({ sdp: pc.localDescription }), console.error);
            } else if (parsedMessage.sdp.type === 'answer') {
                pc.setRemoteDescription(new RTCSessionDescription(parsedMessage.sdp));
            }
        }
    }

    async setLocalDescriptionAndSendMessage(pc, clientId, camId) {
        const offer = await pc.createOffer();
        pc.setLocalDescription(offer);
        await this.sendMessage(clientId, camId, JSON.stringify({ sdp: pc.localDescription }), console.error);
    }
}
