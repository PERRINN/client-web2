const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const emailUtils = require('../utils/email')

exports=module.exports=functions.pubsub.schedule('every 60 minutes').onRun(async(context) => {
  try{
    const lastMessages=await admin.firestore().collection('PERRINNMessages').orderBy('PERRINN.emailNotifications').where('lastMessage','==',true).where('verified','==',true).get()
    if(lastMessages==undefined)return null;
    var batch=admin.firestore().batch();
    var usersToBeNotified=[];
    lastMessages.forEach(message=>{
      var reads={};
      if(message.data().reads!=undefined)reads=message.data().reads;
      (message.data().PERRINN.emailNotifications||[]).forEach(user=>{
        if(!usersToBeNotified.includes(user)&&reads[user]==undefined)usersToBeNotified.push(user);
      })
      batch.update(admin.firestore().collection('PERRINNMessages').doc(message.id),{"PERRINN.emailNotifications":admin.firestore.FieldValue.delete()});
    })
    usersToBeNotified.forEach(user=>{
      emailUtils.sendNewMessageEmail(user)
    })
    return batch.commit()
  }
  catch(error){
    console.log(error);
    emailUtils.sendErrorEmail(error);
    return error;
  }
});
