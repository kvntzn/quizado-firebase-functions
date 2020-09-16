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
exports.updateRecommendations = functions.firestore.document('QuizList/{quizId}/Results/{id}')
    .onWrite((snap, context) => {
        console.log(snap.before, snap.after)

        const collection = context.params.Results;
        const id = context.params.id;

        const feeds = admin.firestore().collection('feeds');
        var userRecommendations = feeds.doc(id).collection('recommedations');

        // try{
        //     userRecommendations.listDocuments().then(val => {
        //         val.map((val) => {
        //             val.delete()
        //         });
        //     })
        // }catch(ex){
        //     console.log(ex);
        // }

        // var doc = snap.after.data();
        const quizzes = admin.firestore().collection('QuizList').orderBy('category', 'asc' ).limit(4).get()
        quizzes.then(val => {
            val.forEach(doc => {
                console.log(doc.data());
                userRecommendations.add(doc.data());
            })

            return null;
        }).catch(error => { console.log (error); })

        console.log(feeds);
        return feeds;
    });
 
    


