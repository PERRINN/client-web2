const admin = require('firebase-admin')
const teamUtils = require('./team')
const dbUtils = require('./db')
const onshapeUtils = require('./onshape')
const googleUtils = require('./google')
const emailUtils = require('../utils/email')

module.exports = {

  executeProcess:(user,functionObj,inputs)=>{
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
