const functions = require('firebase-functions');

const admin = require('firebase-admin');
const { firestore } = require('firebase-admin');
admin.initializeApp();

//user signup
exports.newUserSignup = functions.auth.user().onCreate((user) => {
    
    return admin.firestore().collection('Users').doc(user.uid).set({
        email: user.email,
        image: user.photoURL,
        name: user.displayName
    })
})

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

// firestore triggers
exports.updateRecommendations = functions.firestore.document('/Results/{id}')
    .onCreate((snap, context) => {
        console.log(snap.data())

        const collection = context.params.Results;
        const id = context.params.id;

        const feeds = admin.firestore().collection('feeds');
        const mostPopular  = feeds.collection('mostPopular');
        
        var userRecommendations = feeds.doc(id).collection('recommedations');

        // get quiz list
        const quizzes = admin.firestore().collection('QuizList').orderBy('category',snap.get('category')).limit(4).get();
        quizzes.forEach(it => {
            userRecommendations.add(it)
        });
        // foreach quiz add them to userREcommendations


        return null;
    })


