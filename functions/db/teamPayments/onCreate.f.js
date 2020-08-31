const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const stripeObj = require('stripe')(functions.config().stripe.token);
const createMessageUtils = require('../../utils/createMessage')

exports=module.exports=functions.firestore.document('PERRINNTeams/{user}/payments/{chargeID}').onCreate((data,context)=>{
  return admin.auth().getUser(context.params.user).then(function(userRecord) {
    return admin.firestore().doc('PERRINNTeams/'+context.params.user).get().then(userObj=>{
      var email=userRecord.toJSON().email;
      const val = data.data();
      if (val === null || val.id || val.error) return null;
      const amount=val.amountCharge;
      const currency=val.currency;
      const source=val.source;
      const description=val.amountCOINSPurchased+" COINS to "+email;
      const idempotency_key=context.params.chargeID;
      let charge = {amount,currency,source,description};
      return stripeObj.charges.create(charge, {idempotency_key})
      .then(response=>{
        if (response.outcome.seller_message=='Payment complete.'){
          let sender='-L7jqFf8OuGlZrfEK6dT';
          let messageObj={
            user:sender,
            text:"Thank you for purchasing "+val.amountCOINSPurchased+" new COINS.",
            recipientList:[sender,'QYm5NATKa6MGD87UpNZCTl6IolX2',context.params.user],
            process:{
              inputs:{
                amount:val.amountCOINSPurchased,
                receiver:context.params.user,
                receiverName:userObj.data().name,
                receiverFamilyName:userObj.data().familyName,
                reference:context.params.chargeID
              },
              function:{
                name:'transactionOut'
              },
              inputsComplete:true
            }
          };
          createMessageUtils.createMessageAFS(messageObj);
        }
        return data.ref.set(response,{merge:true});
      }, error=>{
        return data.ref.update({
          errorMessage:error.message,
          errorType:error.type
        });
      });
    });
  });
});
