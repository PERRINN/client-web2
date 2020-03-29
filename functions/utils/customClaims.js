const admin = require('firebase-admin')
const createMessageUtils = require('./createMessage')
const emailUtils = require('../utils/email')

module.exports = {

  setCustomClaims:(user)=>{
    return admin.firestore().doc('PERRINNTeams/'+user).get().then(userObj=>{
      if(userObj==undefined)return;
      if(userObj.data()==undefined)return;
      if(userObj.data().lastMessageBalance==undefined)return;
      if(userObj.data().lastMessageBalance>0&&!Boolean(userObj.data().member)){
        return admin.auth().setCustomUserClaims(user,{
          member:true
        }).catch(error=>{
          console.log('no user account');
          return 'no user account';
        }).then(()=>{
          return admin.firestore().doc('PERRINNTeams/'+user).update({
            member:true
          }).then(()=>{
            return admin.auth().revokeRefreshTokens(user).then(()=>{
              let sender='-L7jqFf8OuGlZrfEK6dT';
              let messageObj={
                user:sender,
                text:"You are now a Member of the PERRINN Team!",
                chatSubject:'Membership activated',
                recipientList:[sender,'QYm5NATKa6MGD87UpNZCTl6IolX2',user]
              };
              return createMessageUtils.createMessageAFS(messageObj);
            });
          });
        });
      }
      if(userObj.data().lastMessageBalance<=0&&Boolean(userObj.data().member)){
        return admin.auth().setCustomUserClaims(user,{
          member:false
        }).catch(error=>{
          console.log('no user account');
          return 'no user account';
        }).then(()=>{
          return admin.firestore().doc('PERRINNTeams/'+user).update({
            member:false
          }).then(()=>{
            return admin.auth().revokeRefreshTokens(user).then(()=>{
              let sender='-L7jqFf8OuGlZrfEK6dT';
              let messageObj={
                user:sender,
                text:"You are no longer a Member of the PERRINN Team.",
                chatSubject:'Membership de-activated',
                recipientList:[sender,'QYm5NATKa6MGD87UpNZCTl6IolX2',user]
              };
              return createMessageUtils.createMessageAFS(messageObj);
            });
          });
        });
      }
    }).catch(error=>{
      console.log(error);
      emailUtils.sendErrorEmail(error);
      return error;
    });
  }

}
