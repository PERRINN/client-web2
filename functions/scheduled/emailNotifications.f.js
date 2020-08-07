const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const emailUtils = require('../utils/email')

exports=module.exports=functions.pubsub.schedule('every 10 minutes').onRun(async(context) => {
  try{
    const lastMessages=await admin.firestore().collection('PERRINNMessages').orderBy('PERRINN.emailNotifications').where('lastMessage','==',true).get()
    const teams=await admin.firestore().collection('PERRINNTeams').where('enableEmailNotifications','==',true).get()
    if(lastMessages==undefined)return null;
    if(teams==undefined)return null;
    var batch=admin.firestore().batch();
    var notifications=[];
    lastMessages.forEach(message=>{
      var reads={};
      if(message.data().reads!=undefined)reads=message.data().reads;
      (message.data().PERRINN.emailNotifications||[]).forEach(notification=>{
        teams.forEach(team=>{
          if(team.id==notification&&!notifications.includes(notification)&&reads[team.id]==undefined)notifications.push(notification);
        })
      })
      batch.update(admin.firestore().collection('PERRINNMessages').doc(message.id),{"PERRINN.emailNotifications":admin.firestore.FieldValue.delete()});
    })
    notifications.forEach(notification=>{
      emailUtils.sendNewMessageEmail(notification)
    })
    return batch.commit()
  }
  catch(error){
    console.log(error);
    emailUtils.sendErrorEmail(error);
    return error;
  }
});
