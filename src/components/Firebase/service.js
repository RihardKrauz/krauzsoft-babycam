import app from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

const config = {
    apiKey: 'AIzaSyCFbsF46JMd6EIn7c7DV55-iI5luEt6k8Q',
    authDomain: 'krauzsoft-babycam.firebaseapp.com',
    databaseURL: 'https://krauzsoft-babycam.firebaseio.com',
    projectId: 'krauzsoft-babycam',
    storageBucket: 'krauzsoft-babycam.appspot.com',
    messagingSenderId: '665506184878'
};

export default class Firebase {
    constructor() {
        app.initializeApp(config);

        this.store = app.firestore();
        this.auth = app.auth();
        this.authProvider = new app.auth.GoogleAuthProvider();
    }

    addUserIfNotExists = async user => {
        const existingUserQuerySnapshot = await this.store
            .collection('users')
            .where('email', '==', user.email)
            .get()
            .catch(console.error);
        if (existingUserQuerySnapshot.empty === true) {
            return await this.store
                .collection('users')
                .add(user)
                .catch(console.error);
        }
    };

    createCam = async ({ email }) =>
        await this.store
            .collection('cams')
            .add({ email })
            .catch(console.error);

    getCamWatchers = camId =>
        this.store
            .collection('cams')
            .doc(camId)
            .collection('watchers');

    getCamMessages = camId =>
        this.store
            .collection('cams')
            .doc(camId)
            .collection('messages');

    getActiveCamIdsByOwnerKey = async email => {
        let result = [];
        const camQuerySnapshot = await this.store
            .collection('cams')
            .where('email', '==', email)
            .where('isActive', '==', true)
            .get();
        camQuerySnapshot.forEach(doc => {
            result.push(doc.id);
        });
        return result;
    };

    setCamActive = (camId, value) => {
        this.store
            .collection('cams')
            .doc(camId)
            .set({ isActive: value }, { merge: true });
    };
}
