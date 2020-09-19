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
    let membersEmails=[]
    const listUsersResult=await admin.auth().listUsers()
    for(const userRecord of listUsersResult.users){
      let messageRef=''
      let messageData={}
      let lastUserMessage=await admin.firestore().collection('PERRINNMessages').where('user','==',userRecord.uid).orderBy('serverTimestamp','desc').limit(1).get()
      let result=await verifyMessageUtils.verifyMessage(lastUserMessage.docs[0].id,lastUserMessage.docs[0].data())
      if (result.wallet.balance>0)membersEmails.push(result.userEmail)
      userCount=userCount+1
    }
    const googleUsers=await googleUtils.googleGroupMembersGet()
    let googleEmails=[]
    googleUsers.data.members.forEach(member=>{
      googleEmails.push(member.email)
    })
    let googleEmailsInvalid=[]
    googleEmails.forEach(email=>{
      if(!membersEmails.includes(email))googleEmailsInvalid.push(email)
    })
    for(const email of googleEmailsInvalid){
      await googleUtils.googleGroupMemberDelete(email)
    }
    let googleEmailsMissing=[]
    membersEmails.forEach(email=>{
      if(!googleEmails.includes(email))googleEmailsMissing.push(email)
    })
    const onshapeUsers=await onshapeUtils.onshapeTeamMembersGet()
    let onshapeEmails=[]
    onshapeUsers.items.forEach(item=>{
      onshapeEmails.push(item.member.email)
    })
    let onshapeEmailsInvalid=[]
    onshapeEmails.forEach(email=>{
      if(!membersEmails.includes(email))onshapeEmailsInvalid.push(email)
    })
    let onshapeEmailsMissing=[]
    membersEmails.forEach(email=>{
      if(!onshapeEmails.includes(email))onshapeEmailsMissing.push(email)
    })
    console.log(userCount+' users processed.')
    console.log(membersEmails.length+' PERRINN members.')
    console.log(googleEmails.length+' Google users.')
    console.log(onshapeEmails.length+' Onshape users.')
    console.log('invalid Google Emails: '+JSON.stringify(googleEmailsInvalid))
    console.log('invalid Onshape Emails: '+JSON.stringify(onshapeEmailsInvalid))
    console.log('missing Google Emails: '+JSON.stringify(googleEmailsMissing))
    console.log('missing Onshape Emails: '+JSON.stringify(onshapeEmailsMissing))
  }
  catch(error){
    console.log(error)
    emailUtils.sendErrorEmail(error)
  }
})
