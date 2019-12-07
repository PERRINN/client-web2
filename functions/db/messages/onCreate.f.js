const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const createMessageUtils = require('../../utils/createMessage')

exports=module.exports=functions.firestore.document('PERRINNMessages/{message}').onCreate((data,context)=>{
  return admin.firestore().collection('PERRINNMessages').where('chain','==',data.data().chain).where('lastMessage','==',true).get().then(messages=>{
    var batch = admin.firestore().batch();
    messages.forEach(message=>{
      if(message.id!=context.params.message)batch.update(admin.firestore().collection('PERRINNMessages').doc(message.id),{lastMessage:false});
    });
    return batch.commit();
  }).then(()=>{
    return 'done';
  }).catch(error=>{
    console.log(error);
    return error;
  });
});
