const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const emailUtils = require('../../utils/email')

exports=module.exports=functions.firestore.document('PERRINNTeams/{team}/reads/{message}').onCreate((data,context)=>{
  return admin.firestore().doc('PERRINNMessages/'+context.params.message).set({
    reads:{
      [context.params.team]:data.data().timestamp[0]
    }
  },{merge:true}).catch(error=>{
    console.log(error);
    emailUtils.sendErrorEmail(error);
  });
});
