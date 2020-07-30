const admin = require('firebase-admin')
const emailUtils = require('../utils/email')

module.exports = {

  createMessageAFS:async(messageObj)=>{
    try{
      const ref=await admin.firestore().collection('IDs').add({
        user:messageObj.user,
        serverTimestamp: admin.firestore.FieldValue.serverTimestamp()
      })
      if(messageObj.domain==undefined)messageObj.domain=messageObj.user;
      const userData=await admin.firestore().doc('PERRINNTeams/'+messageObj.user).get()
      messageObj.serverTimestamp=admin.firestore.FieldValue.serverTimestamp();
      if(messageObj.chatSubject==undefined)messageObj.chatSubject='';
      if(messageObj.chain==undefined)messageObj.chain=ref.id;
      messageObj.name=userData.data().name;
      messageObj.familyName=userData.data().familyName;
      messageObj.imageUrlThumbUser=userData.data().imageUrlThumb;
      messageObj.auto=true;
      messageObj.domain=messageObj.domain;
      return admin.firestore().collection('PERRINNMessages').add(messageObj);
    }
    catch(error){
      console.log(error);
      emailUtils.sendErrorEmail(error);
      return error;
    }
  },

}
