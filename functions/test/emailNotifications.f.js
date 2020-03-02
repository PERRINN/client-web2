const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const emailUtils = require('../utils/email')

exports=module.exports=functions.database.ref('/toto').onCreate((data,context)=>{
  return admin.firestore().collection('PERRINNMessages').orderBy('emailNotifications').where('lastMessage','==',true).get().then(messages=>{
    return admin.firestore().collection('PERRINNTeams').where('enableEmailNotifications','==',true).get().then(teams=>{
      if(messages==undefined)return null;
      if(teams==undefined)return null;
      var batch=admin.firestore().batch();
      var notifications=[];
      messages.forEach(message=>{
        message.data().emailNotifications.forEach(notification=>{
          teams.forEach(team=>{
            if(team.id==notification&&!notifications.includes(notification))notifications.push(notification);
          });
        });
        batch.update(admin.firestore().collection('PERRINNMessages').doc(message.id),{emailNotifications:admin.firestore.FieldValue.delete()});
      });
      notifications.forEach(notification=>{
        emailUtils.sendNewMessageEmail(notification);
      });
      return batch.commit();
    }).then(()=>{
      return 'done';
    });
  }).catch(error=>{
    console.log(error);
    emailUtils.sendErrorEmail(error);
    return error;
  });
});
