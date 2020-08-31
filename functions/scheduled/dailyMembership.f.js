const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const emailUtils = require('../utils/email')
const verifyMessageUtils = require('../utils/verifyMessage')
const onshapeUtils = require('../utils/onshape')
const googleUtils = require('../utils/google')

const runtimeOpts={timeoutSeconds:540,memory:'1GB'}

exports=module.exports=functions.runWith(runtimeOpts).pubsub.schedule('every 24 hours').onRun(async(context) => {
  try{
    let userCount=0
    let members=[]
    let membersWithEmail=[]
    const listUsersResult=await admin.auth().listUsers()
    for(const userRecord of listUsersResult.users){
      let messageRef=''
      let messageData={}
      let lastUserMessage=await admin.firestore().collection('PERRINNMessages').where('user','==',userRecord.uid).orderBy('serverTimestamp','desc').limit(1).get()
      let result=await verifyMessageUtils.verifyMessage(lastUserMessage.docs[0].id,lastUserMessage.docs[0].data())
      if (result.wallet.amount>0)members.push(result.user)
      if (result.wallet.amount>0&&result.userEmail&&result.userEmail!='')membersWithEmail.push(result.userEmail)
      userCount=userCount+1
    }
    const listGoogleUsers=await googleUtils.getPERRINNGoogleGroup()
    let googleUsers=[]
    listGoogleUsers.data.members.forEach(member=>{
      googleUsers.push(member.email)
    })
    const listOnshapeUsers=await onshapeUtils.getPERRINNOnshapeTeam()
    let onshapeUsers=[]
    listOnshapeUsers.items.forEach(item=>{
      onshapeUsers.push(item.member.email)
    })
    console.log(userCount+' users processed.');
    console.log(members.length+' PERRINN members.');
    console.log(membersWithEmail.length+' PERRINN members with PERRINN email.');
    console.log(googleUsers.length+' Google users.');
    console.log(onshapeUsers.length+' Onshape users.');
  }
  catch(error){
    console.log(error)
    emailUtils.sendErrorEmail(error)
  }
})
