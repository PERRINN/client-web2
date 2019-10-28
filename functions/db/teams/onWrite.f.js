const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const teamUtils = require('../../utils/team')

exports=module.exports=functions.firestore.document('/PERRINNTeams/{team}').onWrite((change,context)=>{
  const beforeData = change.before.data();
  const afterData = change.after.data();
  var keys=['lastMessageTimestamp','lastMessageTimestampNegative','lastMessageName','lastMessageText','lastMessageBalance','name','familyName','imageUrlThumb','leaders','members'];
  var updateKeys=[];
  keys.forEach(key=>{
    if(teamUtils.isNewDataValid(key,beforeData,afterData))updateKeys.push(key);
  });
  if(updateKeys==[])return null;
  var batch = admin.firestore().batch();
  updateKeys.forEach(updateKey=>{
    var updateValue;
    if (afterData[updateKey]==undefined) updateValue=null;
    else updateValue=afterData[updateKey];
    if(updateKey=='name'||updateKey=='familyName') {
      var nameLowerCase="";
      if(afterData['name']!=undefined) nameLowerCase=afterData['name'].toLowerCase();
      if(afterData['familyName']!=undefined) nameLowerCase=nameLowerCase+' '+afterData['familyName'].toLowerCase();
      batch.update(admin.firestore().doc('PERRINNTeams/'+context.params.team),{searchName:nameLowerCase},{create:true});
    }
  });
  return batch.commit();
});
