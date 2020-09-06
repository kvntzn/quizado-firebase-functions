const functions = require('firebase-functions');

const admin = require('firebase-admin')
admin.initializeApp();

exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

// firestore triggers
exports.logActivities = functions.firestore.document('/{collection}/{id}')
    .onCreate((snap, context) => {
        console.log(snap.data())

        const collection = context.params.collection;
        const id = context.params.id;

        const activities = admin.firestore().collection('activities');

        if(collection === 'Users'){
            return activities.add({text: 'a new user was added'})
        }

        return null;
    })