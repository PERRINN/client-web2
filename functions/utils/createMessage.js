const admin = require('firebase-admin')
const emailUtils = require('../utils/email')

module.exports = {

  createMessageAFS:async(messageObj)=>{
    try{
      const ref=await admin.firestore().collection('IDs').add({
        user:messageObj.user,
        serverTimestamp:admin.firestore.FieldValue.serverTimestamp()
      })
      messageObj.serverTimestamp=admin.firestore.FieldValue.serverTimestamp();
      messageObj.chain=messageObj.chain||ref.id;
      messageObj.auto=true;
      messageObj.PERRINN.emailNotifications=[];
      return admin.firestore().collection('PERRINNMessages').add(messageObj);
    }
    catch(error){
      console.log(error);
      emailUtils.sendErrorEmail(error);
      return error;
    }
  },

}
