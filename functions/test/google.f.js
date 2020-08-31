const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const googleUtils = require('../utils/google')

exports=module.exports=functions.database.ref('/toto').onCreate((data,context)=>{
  return googleUtils.getPERRINNGoogleGroup().then(result=>{
    let users=[]
    result.data.members.forEach(member=>{
      users.push(member.email)
    })
    console.log(JSON.stringify(users));
  });
});
