const functions = require('firebase-functions');

const admin = require('firebase-admin');
const { firestore } = require('firebase-admin');
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
            return activities.add({text: 'a new user was added' + id })
        }

        if(collection === 'Results'){
            return activities.add({text: id + 'has completed a quiz' })
        }

        return null;
    })

exports.scheduledFunction = functions.pubsub.schedule('every 5 minutes')
    .onRun(async (snap, context) => {
        console.log('This will be run every 5 minutes!');

        // const feed = admin.firestore().collection('feed').collection('trends');

        // const quizzes = admin.firestore().collection('Results')
        // const collection = await quizzes.get();
        
        // collection.docs.forEach(doc => {
        //     doc.get()
            
        // });
    });