const admin = require('firebase-admin')
const onshapeUtils = require('./onshape')
const googleUtils = require('./google')
const emailUtils = require('../utils/email')

module.exports = {

  executeProcess:async(user,functionObj,inputs,message)=>{
    try{
      if (functionObj.name=='joinPERRINNOnshapeTeam')return onshapeUtils.joinPERRINNOnshapeTeam(user)
      if (functionObj.name=='joinPERRINNGoogleGroup')return googleUtils.joinPERRINNGoogleGroup(user)
      if (functionObj.name=='createTeam'){
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
        await batch.commit()
        return 'team created'
      }
      if (functionObj.name=='updateTeamImage'){
        await admin.firestore().doc('PERRINNTeams/'+inputs.target).update({
          imageTimestamp:inputs.imageTimestamp,
          imageUrlOriginal:inputs.imageUrlOriginal
        })
        return 'picture updated'
      }
      if (functionObj.name=='updateTeamMembershipCost'){
        await admin.firestore().doc('PERRINNTeams/'+inputs.target).update({
          membershipCost:inputs.membershipCost
        })
        return 'membership cost updated'
      }
      if (functionObj.name=='addChild'){
        await admin.firestore().doc('PERRINNTeams/'+inputs.target).update({
          [`children.${inputs.child}`]:inputs.childObj
        })
        await admin.firestore().doc('PERRINNTeams/'+inputs.child).update({
            [`parents.${inputs.target}`]:inputs.parentObj
        })
        return 'child added';
      }
      if (functionObj.name=='unpinMessage'){
        await admin.firestore().doc('PERRINNMessages/'+inputs.target).update({
          pin:false
        })
        return 'message unpinned'
      }
      return 'none';
    }
    catch(error){
      console.log(error);
      emailUtils.sendErrorEmail(error);
      return error;
    }
  }

}
