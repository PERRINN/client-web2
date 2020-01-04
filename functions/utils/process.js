const admin = require('firebase-admin')
const teamUtils = require('./team')
const dbUtils = require('./db')
const onshapeUtils = require('./onshape')
const googleUtils = require('./google')

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
      if (functionObj.name=='updateUserName') {
        var nameLowerCase=inputs.name.toLowerCase()+' '+inputs.familyName.toLowerCase();
        return admin.firestore().doc('PERRINNTeams/'+user).update({
          name:inputs.name,
          familyName:inputs.familyName,
          searchName:nameLowerCase
        }).then(()=>{
          return 'name updated';
        });
      }
      if (functionObj.name=='updateUserImage') {
        return admin.firestore().doc('PERRINNTeams/'+user).update({
          imageTimestamp:inputs.imageTimestamp,
          imageUrlOriginal:inputs.imageUrlOriginal
        }).then(()=>{
          return 'picture updated';
        });
      }
      return 'none';
    }).catch(error=>{
      console.log('executeProcess: '+error);
      return error;
    }).then(result=>{
      return result;
    });
  }

}
