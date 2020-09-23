const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const emailUtils = require('../utils/email')
const verifyMessageUtils = require('../utils/verifyMessage')
const onshapeUtils = require('../utils/onshape')
const googleUtils = require('../utils/google')

exports=module.exports=functions.firestore.document('toto/toto').onCreate(async(data,context)=>{
  try{
    const onshapeUsers=await onshapeUtils.onshapeTeamMembersGet()
    console.log('users: '+JSON.stringify(onshapeUsers))
    let onshapeEmails=[]
    let onshapeUids=[]
    onshapeUsers.items.forEach(item=>{
      onshapeEmails.push(item.member.email)
      onshapeUids.push(item.member.id)
    })
    console.log('emails: '+JSON.stringify(onshapeEmails))
    console.log('uids: '+JSON.stringify(onshapeUids))
  }
  catch(error){
    console.log(error)
    emailUtils.sendErrorEmail(error)
  }
})
