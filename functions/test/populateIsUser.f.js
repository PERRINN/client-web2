const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}

exports=module.exports=functions.database.ref('/toto').onCreate((data,context)=>{
  var maxUpdatesCount=400;
  return admin.firestore().collection('PERRINNTeams').get().then(teams=>{
    var batch = admin.firestore().batch();
    var updatesCount=0;
    teams.forEach(team=>{
      if(team.data().leaders!=undefined){
      if(team.data().leaders[team.id]!=undefined){
        batch.update(admin.firestore().collection('PERRINNTeams').doc(team.id),{isUser:true},{create:true});
      }
      }
      updatesCount+=1;
      if(updatesCount>maxUpdatesCount){
        batch.commit();
        batch = admin.firestore().batch();
        updatesCount=0;
        console.log('next batch');
      }
    });
    console.log('last batch');
    return batch.commit();
  });
});
