const admin = require('firebase-admin')
const onshapeUtils = require('./onshape')
const googleUtils = require('./google')
const emailUtils = require('../utils/email')

module.exports = {

  executeProcess:async(user,functionObj,inputs,message)=>{
    try{
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
