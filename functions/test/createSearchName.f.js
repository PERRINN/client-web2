const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}

exports=module.exports=functions.database.ref('/toto').onCreate((data,context)=>{
  var maxUpdatesCount=400;
  return admin.firestore().collection('PERRINNTeams').get().then(teams=>{
    var batch = admin.firestore().batch();
    var updatesCount=0;
    teams.forEach(team=>{
      if(team.data().searchName==undefined){
        var nameLowerCase="";
        if(team.data().name!=undefined) nameLowerCase=team.data().name.toLowerCase();
        if(team.data().familyName!=undefined) nameLowerCase=nameLowerCase+' '+team.data().familyName.toLowerCase();
        batch.update(admin.firestore().collection('PERRINNTeams').doc(team.id),{searchName:nameLowerCase},{create:true});
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
