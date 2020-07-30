const admin = require('firebase-admin')
const createMessageUtils = require('./createMessage')
const emailUtils = require('../utils/email')
const toolsUtils = require('./tools')

module.exports = {

  performChildTopUp:(user)=>{
    return admin.firestore().doc('PERRINNTeams/'+user).get().then(userObj=>{
      if(userObj==undefined)return;
      if(userObj.data()==undefined)return;
      if(userObj.data().lastMessageBalance==undefined)return;
      if(userObj.data().parents==undefined)return;
      if(userObj.data().lastMessageBalance<1&&(userObj.data().parents!={})){
        let parents=toolsUtils.objectToArray(userObj.data().parents);
        let sender=parents[0][0];
        let amount=5-userObj.data().lastMessageBalance;
        let messageObj={
          user:sender,
          text:"Automatic top up: "+amount+" COINS.",
          recipientList:[sender,user],
          process:{
            inputs:{
              amount:amount,
              receiver:user,
              receiverName:userObj.data().name,
              receiverFamilyName:userObj.data().familyName,
              reference:'automatic top up'
            },
            function:{
              name:'transactionOut'
            },
            inputsComplete:true
          }
        };
        createMessageUtils.createMessageAFS(messageObj);
      }
    }).catch(error=>{
      console.log(error);
      emailUtils.sendErrorEmail(error);
      return error;
    });
  }

}
