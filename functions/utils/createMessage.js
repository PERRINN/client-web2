const admin = require('firebase-admin')
const processUtils = require('./process')
const teamUtils = require('./team')
const emailUtils = require('../utils/email')

module.exports = {

  createMessageAFS:(messageObj)=>{
    return admin.firestore().collection('IDs').add({
      user:messageObj.user,
      serverTimestamp: admin.firestore.FieldValue.serverTimestamp()
    }).then(ref=>{
      if(messageObj.domain==undefined)messageObj.domain=messageObj.user;
      return admin.firestore().doc('PERRINNTeams/'+messageObj.domain).get().then(domainObj=>{
        return admin.firestore().doc('PERRINNTeams/'+messageObj.user).get().then(userData=>{
          var reads=[];
          messageObj.recipientList.forEach(recipient=>{
            reads.push(admin.firestore().doc('PERRINNTeams/'+recipient).get());
          });
          return Promise.all(reads).then(results=>{
            messageObj.recipients={};
            messageObj.recipientList.forEach((recipient,index)=>{
              var name='';
              var familyName='';
              var imageUrlThumb='';
              if(results[index].data().name!=undefined)name=results[index].data().name;
              if(results[index].data().familyName!=undefined)familyName=results[index].data().familyName;
              if(results[index].data().imageUrlThumb!=undefined)imageUrlThumb=results[index].data().imageUrlThumb;
              messageObj.recipients[recipient]={
                name:name,
                familyName:familyName,
                imageUrlThumb:imageUrlThumb
              };
            });
            messageObj.timestamp=Date.now();
            messageObj.serverTimestamp=admin.firestore.FieldValue.serverTimestamp();
            if(messageObj.chatSubject==undefined)messageObj.chatSubject='';
            if(messageObj.chain==undefined)messageObj.chain=ref.id;
            messageObj.emailNotifications=messageObj.recipientList;
            messageObj.lastMessage=true;
            messageObj.name=userData.data().name;
            messageObj.familyName=userData.data().familyName;
            messageObj.imageUrlThumbUser=userData.data().imageUrlThumb;
            messageObj.auto=true;
            messageObj.domain=domainObj.id;
            messageObj.domainName=domainObj.data().name;
            messageObj.domainImageUrlThumb=domainObj.data().imageUrlThumb;
            return admin.firestore().collection('PERRINNMessages').add(messageObj);
          });
        });
      });
    }).catch(error=>{
      console.log(error);
      emailUtils.sendErrorEmail(error);
      return error;
    });
  },

}
