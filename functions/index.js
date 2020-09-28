const functions = require('firebase-functions');

const admin = require('firebase-admin');
const { firestore } = require('firebase-admin');
admin.initializeApp();

//user signup
exports.newUserSignupAuth = functions.auth.user().onCreate((user) => {
    
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
exports.newUserSignup = functions.firestore.document('/Users/{id}')
    .onCreate(async (snap, context) => {
        const id = context.params.id;
        const db = admin.firestore();

        const feeds = db.collection('feeds');
        const quizList = db.collection('QuizList');
        const userRecommendations = feeds.doc(id).collection('recommedations');

        await populateUserFeed(quizList, userRecommendations, null);
        return feeds;
    })

// firestore triggers
exports.updateRecommendations = functions.firestore.document('QuizList/{quizId}/Results/{id}')
    .onWrite(async (snap, context) => {
        const id = context.params.id;
        const quizId = context.params.quizId;
        const db = admin.firestore();

        console.log( snap.before.data());
        console.log( snap.after.data());
        
        // Recommendations
        const feeds = db.collection('feeds');
        const userRecommendations = feeds.doc(id).collection('recommedations');
        await deleteQueryBatch(db, userRecommendations);

        // Score
        const currentScore = !snap.after.data() ? snap.after.data().correct : 0;
        const oldScore = !snap.before.data() ? snap.after.data().correct : 0;

        const quizList = db.collection('QuizList');
        await quizList.doc(quizId).update({
            taken : admin.firestore.FieldValue.increment(1)
        })

        const userDoc = db.collection('Users').doc(id);
        const userResults = userDoc.collection('results');
        userResults.doc(quizId).set({score:  currentScore})

        const user = await userDoc.get();
        console.log(oldScore, currentScore)
        const difference = (oldScore - currentScore) * -1; 
        db.collection('leaderboard').doc(id).set({
            name : user.data().name,
            score : admin.firestore.FieldValue.increment(difference)
        });

        await populateUserFeed(quizList, userRecommendations, snap.after.data().quiz_category);
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

async function populateUserFeed(quizList, userRecommendations, recentResult){
    let rankRecommendation = 0;
    const quizRecommendation = !recentResult ? await quizList.orderBy('category', 'asc').startAfter(recentResult).limit(4).get() :  await quizList.orderBy('category', 'asc' ).limit(4).get();
    quizRecommendation.forEach(doc => {
        const quizData = doc.data();
        userRecommendations.doc(doc.id).set({
            category : quizData.category,
            desc : quizData.desc,
            image : quizData.image,
            level : quizData.level,
            name : quizData.name,
            taken : quizData.taken,
            questions: quizData.questions,
            rankRecommendation : rankRecommendation
        })

        rankRecommendation++;
    });
}



