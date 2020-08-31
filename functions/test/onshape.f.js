const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const onshapeUtils = require('../utils/onshape')

exports=module.exports=functions.database.ref('/toto').onCreate((data,context)=>{
  return onshapeUtils.getPERRINNOnshapeTeam().then(result=>{
    let users=[]
    result.items.forEach(item=>{
      users.push(item.member.email)
    })
    console.log(JSON.stringify(users));
  });
});
