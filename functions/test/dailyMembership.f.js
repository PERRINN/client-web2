const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const emailUtils = require('../utils/email')
const verifyMessageUtils = require('../utils/verifyMessage')
const onshapeUtils = require('../utils/onshape')
const googleUtils = require('../utils/google')

exports=module.exports=functions.firestore.document('toto/toto').onCreate(async(data,context)=>{
  try{
    let googleEmailsInvalid=["alex.07.guerrero@gmail.com","dolbain@gmail.com","edytado@gmail.com","maj.lukas@googlemail.com","matteo.incorvaia@icloud.com","nicolas@perrinn.com","perrinnlimited@gmail.co","shao.pufang@gmail.com","victoryspecificationii@gmail.com"]
    for(const email of googleEmailsInvalid){
      await googleUtils.googleGroupMemberDelete(email)
    }
  }
  catch(error){
    console.log(error)
    emailUtils.sendErrorEmail(error)
  }
})
