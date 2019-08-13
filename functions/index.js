const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret);

admin.initializeApp();

// exports.helloWorld = functions.https.onRequest((request, response) => {
//     console.log('a log!')
//     response.send("Hello from Firebase!");
// });

exports.createStripeCustomer = functions.firestore.document('users/{userId}').onCreate(async (snap, context) => {
    const data = snap.data();
    const email = data.email;

    const customer = await stripe.customers.create({
        email: email
    });

    return admin.firestore().collection('users').doc(data.id).update({
        stripeId: customer.id
    });
});
