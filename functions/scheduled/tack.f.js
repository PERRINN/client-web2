const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const emailUtils = require('../utils/email')
const customClaimsUtils = require('../utils/customClaims')

exports=module.exports=functions.pubsub.schedule('every 24 hours').onRun((context) => {
  return admin.firestore().collection('PERRINNTeams').where('lastMessageBalance','>',0).get().then(teams=>{
    if(teams==undefined)return null;
    return admin.firestore().doc('appSettings/costs').get().then(costs=>{
      var amountMembership=costs.data().membershipDay;
      var batch=admin.firestore().batch();
      teams.forEach(team=>{
        if(team.data().previousMessage!=undefined){
          batch.update(admin.firestore().collection('PERRINNMessages').doc(team.data().previousMessage),{"PERRINN.membershipCost.counter":admin.firestore.FieldValue.increment(1)},{create:true});
          batch.update(admin.firestore().collection('PERRINNMessages').doc(team.data().previousMessage),{"PERRINN.membershipCost.amount":admin.firestore.FieldValue.increment(amountMembership)},{create:true});
          batch.update(admin.firestore().collection('PERRINNMessages').doc(team.data().previousMessage),{"PERRINN.membershipCost.timestamp":admin.firestore.FieldValue.serverTimestamp()},{create:true});
          batch.update(admin.firestore().collection('PERRINNMessages').doc(team.data().previousMessage),{"PERRINN.wallet.amount":admin.firestore.FieldValue.increment(-amountMembership)},{create:true});
          batch.update(admin.firestore().collection('PERRINNMessages').doc(team.data().previousMessage),{"PERRINN.wallet.balance":admin.firestore.FieldValue.increment(-amountMembership)},{create:true});
          batch.update(admin.firestore().collection('PERRINNMessages').doc(team.data().previousMessage),{"PERRINN.wallet.timestamp":admin.firestore.FieldValue.serverTimestamp()},{create:true});
          batch.update(admin.firestore().collection('PERRINNTeams').doc(team.id),{lastMessageBalance:admin.firestore.FieldValue.increment(-amountMembership)},{create:true});
          batch.update(admin.firestore().collection('PERRINNTeams').doc(team.id),{membershipCounter:admin.firestore.FieldValue.increment(1)},{create:true});
        }
      });
      return batch.commit();
    }).then(()=>{
      var setCustomClaims=[];
      teams.forEach(team=>{
        setCustomClaims.push(customClaimsUtils.setCustomClaims(team));
      });
      return Promise.all(setCustomClaims).then(()=>{
        return 'done';
      });
    }).catch(error=>{
      console.log(error);
      emailUtils.sendErrorEmail(error);
      return error;
    });
  });
});
