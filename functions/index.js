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

exports.makeCharge = functions.https.onCall((data, context) => {
    const customerId = data.customerId;
    const totalAmount = data.total;
    const idempotency = data.idempotency;
    const uid = context.auth.uid;

    if (uid === null) {
        console.log('Illegal access attempt due to unauthenticated user');
        throw new functions.https.HttpsError('unauthenticated', 'Illegal access attempt.');
    }

    return stripe.charges.create({
        amount: totalAmount,
        currency: 'usd',
        customer: customerId
    }, {
        idempotency_key: idempotency
    }).then(_ => {
        return;
    }).catch(err => {
        console.log(err);
        throw new functions.https.HttpsError('internal', 'Unable to charge.')
    })
});

exports.getEphemeralStripeKey = functions.https.onCall((data, context) => {
    const customerId = data.customer_id;
    const apiVersion = data.api_version;
    const uid = context.auth.uid;

    if (uid === null) {
        console.log('Illegal access attempt due to unauthenticated user');
        throw new functions.https.HttpsError('unauthenticated', 'Illegal access attempt.');
    }

    return stripe.ephemeralKeys.create(
        {customer: customerId},
        {stripe_version: apiVersion}
    ).then(key => {
        return key;
    }).catch(err => {
        console.log(err);
        throw new functions.https.HttpsError('internal', 'Unable to create ephemeral key.');
    })
});
