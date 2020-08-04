const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const emailUtils = require('../utils/email')

exports=module.exports=functions.pubsub.schedule('every 24 hours').onRun(async(context) => {
  try{
    let count=0
    const listUsersResult=await admin.auth().listUsers()
    for(const userRecord of listUsersResult.users){
      let messageRef=''
      let messageData={}
      let lastUserMessages=await admin.firestore().collection('PERRINNMessages').where('user','==',userRecord.uid).orderBy('serverTimestamp','desc').limit(1).get()
      lastUserMessages.forEach(message=>{
        messageRef=message.ref
        messageData=message.data()
        if(messageData.reads==undefined)messageData.reads={}
        messageData.reads[userRecord.uid]=admin.firestore.FieldValue.serverTimestamp()
        messageData.verified=false
      });
      if(messageRef==''){
        const ref=await admin.firestore().collection('IDs').add({
          user:userRecord.uid,
          serverTimestamp: admin.firestore.FieldValue.serverTimestamp()
        })
        messageData.serverTimestamp=admin.firestore.FieldValue.serverTimestamp()
        messageData.chain=ref.id
        messageData.auto=true
        messageData.user=userRecord.uid
        messageData.text='An automatic message to refresh user profile.'
        messageData.reads={}
        messageData.reads[userRecord.uid]=admin.firestore.FieldValue.serverTimestamp()
      }
      if(messageRef!='')await messageRef.delete()
      await admin.firestore().collection('PERRINNMessages').add(messageData)
      count=count+1
    }
    console.log(count+' users processed.');
  }
  catch(error){
    console.log(error)
    emailUtils.sendErrorEmail(error)
  }
})
