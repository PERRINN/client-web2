const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const createMessageUtils = require('../../utils/createMessage')

exports=module.exports=functions.firestore.document('PERRINNTeams/{team}/messages/{message}').onCreate((data,context)=>{
  return admin.firestore().doc('lastMessages/'+data.data().recipientIndex).set(data.data()).then(()=>{
    return 'done';
  }).catch(error=>{
    console.log(error);
    return error;
  });
});
