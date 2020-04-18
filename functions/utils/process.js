const admin = require('firebase-admin')
const onshapeUtils = require('./onshape')
const googleUtils = require('./google')
const emailUtils = require('../utils/email')
const createMessageUtils = require('../utils/createMessage')

module.exports = {

  executeProcess:(user,functionObj,inputs,message)=>{
    return admin.database().ref('undefined').once('value').then(()=>{
      if (functionObj.name=='joinPERRINNOnshapeTeam') {
        return onshapeUtils.joinPERRINNOnshapeTeam (
          user
        ).then(result=>{
          return result;
        });
      }
      if (functionObj.name=='joinPERRINNGoogleGroup') {
        return googleUtils.joinPERRINNGoogleGroup (
          user
        ).then(result=>{
          return result;
        });
      }
      if (functionObj.name=='updateTeamName') {
        var nameLowerCase=inputs.name.toLowerCase()+' '+inputs.familyName.toLowerCase();
        return admin.firestore().doc('PERRINNTeams/'+inputs.target).update({
          name:inputs.name,
          familyName:inputs.familyName,
          searchName:nameLowerCase
        }).then(()=>{
          return 'name updated';
        });
      }
      if (functionObj.name=='createUser') {
        const now=Date.now();
        var batch=admin.firestore().batch();
        var nameLowerCase=inputs.name.toLowerCase()+' '+inputs.familyName.toLowerCase();
        batch.update(admin.firestore().doc('PERRINNTeams/'+user),{createdTimestamp:now},{create:true});
        batch.update(admin.firestore().doc('PERRINNTeams/'+user),{name:inputs.name},{create:true});
        batch.update(admin.firestore().doc('PERRINNTeams/'+user),{familyName:inputs.familyName},{create:true});
        batch.update(admin.firestore().doc('PERRINNTeams/'+user),{imageUrlThumb:inputs.imageUrlThumb},{create:true});
        batch.update(admin.firestore().doc('PERRINNTeams/'+user),{imageUrlMedium:inputs.imageUrlMedium},{create:true});
        batch.update(admin.firestore().doc('PERRINNTeams/'+user),{imageUrlOriginal:inputs.imageUrlOriginal},{create:true});
        batch.update(admin.firestore().doc('PERRINNTeams/'+user),{searchName:nameLowerCase},{create:true});
        batch.update(admin.firestore().doc('PERRINNTeams/'+user),{members:{[user]:{name:inputs.name,familyName:inputs.familyName,leader:true,timestamp:admin.firestore.FieldValue.serverTimestamp()}}},{create:true});
        batch.update(admin.firestore().doc('PERRINNTeams/'+user),{enableEmailNotifications:true},{create:true});
        batch.update(admin.firestore().doc('PERRINNTeams/'+user),{isUser:true},{create:true});
        return batch.commit().then(()=>{
          let sender='-L7jqFf8OuGlZrfEK6dT';
          let messageObj={
            user:sender,
            domain:user,
            text:"Welcome to PERRINN, we are happy to have you here with us! If you have any question please ask here. We will be happy to help.",
            chatSubject:'Welcome to PERRINN',
            recipientList:[sender,'QYm5NATKa6MGD87UpNZCTl6IolX2',user]
          };
          return createMessageUtils.createMessageAFS(messageObj).then(()=>{
            return 'team created';
          });
        });
      }
      if (functionObj.name=='createTeam') {
        const now=Date.now();
        var batch=admin.firestore().batch();
        var nameLowerCase=inputs.name.toLowerCase()+' '+inputs.familyName.toLowerCase();
        batch.update(admin.firestore().doc('PERRINNTeams/'+inputs.target),{createdTimestamp:now},{create:true});
        batch.update(admin.firestore().doc('PERRINNTeams/'+inputs.target),{name:inputs.name},{create:true});
        batch.update(admin.firestore().doc('PERRINNTeams/'+inputs.target),{familyName:inputs.familyName},{create:true});
        batch.update(admin.firestore().doc('PERRINNTeams/'+inputs.target),{imageUrlThumb:inputs.imageUrlThumb},{create:true});
        batch.update(admin.firestore().doc('PERRINNTeams/'+inputs.target),{imageUrlMedium:inputs.imageUrlMedium},{create:true});
        batch.update(admin.firestore().doc('PERRINNTeams/'+inputs.target),{imageUrlOriginal:inputs.imageUrlOriginal},{create:true});
        batch.update(admin.firestore().doc('PERRINNTeams/'+inputs.target),{searchName:nameLowerCase},{create:true});
        batch.update(admin.firestore().doc('PERRINNTeams/'+inputs.target),{members:{[user]:{name:inputs.leaderName,familyName:inputs.leaderFamilyName,leader:true,timestamp:admin.firestore.FieldValue.serverTimestamp()}}},{create:true});
        return batch.commit().then(()=>{
          return 'team created';
        });
      }
      if (functionObj.name=='updateTeamImage') {
        return admin.firestore().doc('PERRINNTeams/'+inputs.target).update({
          imageTimestamp:inputs.imageTimestamp,
          imageUrlOriginal:inputs.imageUrlOriginal
        }).then(()=>{
          return 'picture updated';
        });
      }
      if (functionObj.name=='updateTeamMembershipCost') {
        return admin.firestore().doc('PERRINNTeams/'+inputs.target).update({
          membershipCost:inputs.membershipCost
        }).then(()=>{
          return 'membership cost updated';
        });
      }
      if (functionObj.name=='addChild') {
        return admin.firestore().doc('PERRINNTeams/'+inputs.target).update({
          [`children.${inputs.child}`]:inputs.childObj
        }).then(()=>{
          return admin.firestore().doc('PERRINNTeams/'+inputs.child).update({
            [`parents.${inputs.target}`]:inputs.parentObj
          }).then(()=>{
            return 'child added';
          });
        });
      }
      if (functionObj.name=='unpinMessage') {
        return admin.firestore().doc('PERRINNMessages/'+inputs.target).update({
          pin:false
        }).then(()=>{
          return 'message unpinned';
        });
      }
      return 'none';
    }).then(result=>{
      return result;
    }).catch(error=>{
      console.log(error);
      emailUtils.sendErrorEmail(error);
      return error;
    });
  }

}
