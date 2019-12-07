const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}

exports=module.exports=functions.database.ref('/toto').onCreate((data,context)=>{
  var maxUpdatesCount=400;
  var indexList=[];
  var timestampList=[];
  var messageList=[];
  return admin.firestore().collection('PERRINNMessages').get().then(messages=>{
    var batch = admin.firestore().batch();
    var updatesCount=0;
    messages.forEach(message=>{
      if (message.data().serverTimestamp!=undefined){
        if(!indexList.includes(message.data().chain)){
          indexList.push(message.data().chain);
          timestampList.push(message.data().serverTimestamp);
          messageList.push(message.id);
        } else if (message.data().serverTimestamp.toMillis()>timestampList[indexList.indexOf(message.data().chain)].toMillis()) {
          timestampList[indexList.indexOf(message.data().chain)]=message.data().serverTimestamp;
          messageList[indexList.indexOf(message.data().chain)]=message.id;
        }
      }
    });
    messageList.forEach(message=>{
      batch.update(admin.firestore().collection('PERRINNMessages').doc(message),{lastMessage:true},{create:true});
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
