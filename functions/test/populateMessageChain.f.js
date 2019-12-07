const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}

exports=module.exports=functions.database.ref('/toto').onCreate((data,context)=>{
  var maxUpdatesCount=400;
  var batch = admin.firestore().batch();
  var updatesCount=0;
  return admin.firestore().collection('PERRINNMessages').get().then(messages=>{
    messages.forEach(message=>{
      if(message.data().recipientIndex!=undefined)batch.update(admin.firestore().collection('PERRINNMessages').doc(message.id),{chain:message.data().recipientIndex});
      updatesCount+=1;
      if(updatesCount>maxUpdatesCount){
        batch.commit();
        batch = admin.firestore().batch();
        updatesCount=0;
        console.log('next batch');
      }
    });
    console.log('last batch');
    return batch.commit();
  });
});
