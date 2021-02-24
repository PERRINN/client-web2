const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const emailUtils = require('../utils/email')

exports=module.exports=functions.pubsub.schedule('every 10 minutes').onRun(async(context) => {
  try{
    const timestampGate=new Date(Date.now()-3600000)
    console.log('timestampGate: '+timestampGate)
    const lastMessages=await admin.firestore().collection('PERRINNMessages').orderBy('verifiedTimestamp').where('verifiedTimestamp','<',timestampGate).where('lastMessage','==',true).where('emailNotificationsStatus','==','pending').where('verified','==',true).get()
    if(lastMessages==undefined)return null;
    var batch=admin.firestore().batch();
    var usersToBeNotified=[];
    lastMessages.forEach(message=>{
      var reads={};
      if(message.data().reads!=undefined)reads=message.data().reads;
      (message.data().emailNotificationsList||[]).forEach(user=>{
        if(!usersToBeNotified.includes(user)&&reads[user]==undefined)usersToBeNotified.push(user);
      })
      batch.update(admin.firestore().collection('PERRINNMessages').doc(message.id),{emailNotificationsStatus:'complete'});
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
