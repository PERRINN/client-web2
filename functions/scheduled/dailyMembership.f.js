const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const emailUtils = require('../utils/email')
const verifyMessageUtils = require('../utils/verifyMessage')

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
        verifyMessageUtils.verifyMessage(message.id,message.data())
      });
      count=count+1
    }
    console.log(count+' users processed.');
  }
  catch(error){
    console.log(error)
    emailUtils.sendErrorEmail(error)
  }
})
