const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const emailUtils = require('../utils/email')

exports=module.exports=functions.database.ref('/toto').onCreate(async(data,context)=>{
  try{
    let count=0
    const listUsersResult=await admin.auth().listUsers()
    listUsersResult.users.forEach((userRecord)=>{
      if (userRecord.uid=='QYm5NATKa6MGD87UpNZCTl6IolX2')regerenerateLastMessage(userRecord.uid)
      count=count+1
    })
    console.log(count+' users found.');
  }
  catch(error){
    console.log(error)
    emailUtils.sendErrorEmail(error)
  }
});

async function regerenerateLastMessage(user){
  try{
    let messageRef=''
    let messageData={}
    const lastUserMessages=await admin.firestore().collection('PERRINNMessages').where('user','==',user).orderBy('serverTimestamp','desc').limit(1).get()
    lastUserMessages.forEach(message=>{
      messageRef=message.ref
      messageData=message.data()
      messageData.reads[user]=admin.firestore.FieldValue.serverTimestamp()
      messageData.verified=false
    });
    await messageRef.delete()
    await admin.firestore().collection('PERRINNMessages').add(messageData)
  }
  catch(error){
    console.log(error)
    emailUtils.sendErrorEmail(error)
  }
}
