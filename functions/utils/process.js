const admin = require('firebase-admin')
const teamUtils = require('./team')
const dbUtils = require('./db')
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
      if (functionObj.name=='joinTeam') {
        return admin.firestore().doc('PERRINNMessages/'+message).get().then(messageData=>{
          return admin.firestore().doc('PERRINNTeams/'+inputs.target).get().then(team=>{
            if(team.data().membershipCost!=undefined)
            if (team.data().membershipCost>0){
              let familyName='';
              if(team.data().familyName!=undefined)familyName=team.data().familyName;
              let messageObj={
                domain:messageData.data().domain,
                user:user,
                text:"I am sending "+team.data().membershipCost+" COINS reference: Membership cost",
                chain:messageData.data().chain,
                chatSubject:messageData.data().chatSubject,
                recipientList:messageData.data().recipientList,
                process:{
                  inputs:{
                    amount:team.data().membershipCost,
                    receiver:inputs.target,
                    receiverName:team.data().name,
                    receiverFamilyName:familyName,
                    reference:'Membership cost'
                  },
                  function:{
                    name:'transactionOut'
                  },
                  inputsComplete:true
                }
              };
              createMessageUtils.createMessageAFS(messageObj);
            }
            return admin.firestore().doc('PERRINNTeams/'+inputs.target).update({
              [`members.${inputs.member}`]:inputs.memberObj
            }).then(()=>{
              return 'member added';
            });
          });
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
