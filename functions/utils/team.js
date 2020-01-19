const admin = require('firebase-admin')

module.exports = {

  createTeam:(team,user,name,familyName,parent)=>{
    const now=Date.now();
    var batch=admin.firestore().batch();
    var nameLowerCase=name.toLowerCase()+' '+familyName.toLowerCase();
    batch.update(admin.firestore().doc('PERRINNTeams/'+team),{createdTimestamp:now},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+team),{name:name},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+team),{familyName:familyName},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+team),{searchName:nameLowerCase},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+team),{leaders:{[user]:{name:name}}},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+team),{leadersCount:1},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+team),{enableEmailNotifications:true},{create:true});
    if(parent!=''){
      batch.update(admin.firestore().doc('PERRINNTeams/'+team),{parent:parent},{create:true});
      batch.update(admin.firestore().doc('PERRINNTeams/'+parent),{children:{[team]:{name:name}}},{create:true});
      batch.update(admin.firestore().doc('PERRINNTeams/'+parent),{childrenCount:1},{create:true});
    }
    if(team==user)batch.update(admin.firestore().doc('PERRINNTeams/'+team),{isUser:true},{create:true});
    return batch.commit().then(()=>{
      return 'done';
    });
  },

}
