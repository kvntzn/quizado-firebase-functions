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
    .onWrite(async (snap, context) => {
        console.log(snap.before, snap.after)
        const id = context.params.id;

        const feeds = admin.firestore().collection('feeds');
        const userRecommendations = feeds.doc(id).collection('recommedations');
        const popularQuizzes = feeds.doc(id).collection('popular');

        await deleteQueryBatch(admin.firestore(), popularQuizzes);
        await deleteQueryBatch(admin.firestore(), userRecommendations);

        const topQuizzes = await admin.firestore().collection('QuizList').orderBy('taken', 'asc' ).limit(4).get()
        topQuizzes.forEach(doc => {
            popularQuizzes.add(doc.data());
        })

        // TODO : based on the results category
        const quizRecommendation = await admin.firestore().collection('QuizList').orderBy('category', 'asc' ).limit(4).get()
        quizRecommendation.forEach(doc => {
            userRecommendations.add(doc.data());
        })
        
        console.log(feeds);
        return feeds;
    });

async function deleteQueryBatch(db, query) {
    const snapshot = await query.get();
    
    const batchSize = snapshot.size;
    if (batchSize === 0) {
        // When there are no documents left, we are done
        return;
    }
    
    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    
    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
        deleteQueryBatch(db, query);
    });
}



