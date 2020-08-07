const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const emailUtils = require('../utils/email')

const runtimeOpts={timeoutSeconds:540}

exports=module.exports=functions.runWith(runtimeOpts).pubsub.schedule('every 24 hours').onRun(async(context) => {
  try{
    let count=0
    const listUsersResult=await admin.auth().listUsers()
    for(const userRecord of listUsersResult.users){
      let messageRef=''
      let messageData={}
      let lastUserMessages=await admin.firestore().collection('PERRINNMessages').where('user','==',userRecord.uid).orderBy('serverTimestamp','desc').limit(1).get()
      lastUserMessages.forEach(message=>{
        if((messageData.PERRINN||{}).emailNotifications!=undefined||(messageData.PERRINN||{}).emailNotifications!=null)console.log('email notifications for user: '+userRecord.uid)
        messageRef=message.ref
        messageData=message.data()
        messageData.verified=false
        delete (messageData.PERRINN||{}).emailNotifications
      });
      if(messageRef==''){
        console.log('no message for user: '+userRecord.uid)
        const ref=await admin.firestore().collection('IDs').add({
          user:userRecord.uid,
          serverTimestamp: admin.firestore.FieldValue.serverTimestamp()
        })
        messageData.serverTimestamp=admin.firestore.FieldValue.serverTimestamp()
        messageData.chain=ref.id
        messageData.auto=true
        messageData.user=userRecord.uid
        messageData.text='An automatic message to refresh user profile.'
        delete (messageData.PERRINN||{}).emailNotifications
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
