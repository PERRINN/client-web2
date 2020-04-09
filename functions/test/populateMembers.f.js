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
        let leaders=team.data().leaders;
        let leadersList=Object.keys(leaders).map(function(key) {
          return [key, leaders[key]];
        });
        leadersList.forEach(leader=>{
          batch.update(admin.firestore().doc('PERRINNTeams/'+team.id),{[`members.${leader[0]}.leader`]:true},{create:true});
          updatesCount+=1;
          if(leader[1].timestamp!=undefined){updatesCount+=1;batch.update(admin.firestore().doc('PERRINNTeams/'+team.id),{[`members.${leader[0]}.timestamp`]:leader[1].timestamp},{create:true});}
          if(leader[1].name!=undefined){updatesCount+=1;batch.update(admin.firestore().doc('PERRINNTeams/'+team.id),{[`members.${leader[0]}.name`]:leader[1].name},{create:true});}
          if(leader[1].familyName!=undefined){updatesCount+=1;batch.update(admin.firestore().doc('PERRINNTeams/'+team.id),{[`members.${leader[0]}.familyName`]:leader[1].familyName},{create:true});}
          if(team.id==leader[0]){
            if(team.data().createdTimestamp!=undefined){updatesCount+=1;batch.update(admin.firestore().doc('PERRINNTeams/'+team.id),{[`members.${leader[0]}.timestamp`]:team.data().createdTimestamp},{create:true});}
            if(team.data().name!=undefined){updatesCount+=1;batch.update(admin.firestore().doc('PERRINNTeams/'+team.id),{[`members.${leader[0]}.name`]:team.data().name},{create:true});}
            if(team.data().familyName!=undefined){updatesCount+=1;batch.update(admin.firestore().doc('PERRINNTeams/'+team.id),{[`members.${leader[0]}.familyName`]:team.data().familyName},{create:true});}
          }
        });
      }
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
