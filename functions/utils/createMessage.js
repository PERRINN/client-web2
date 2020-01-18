const admin = require('firebase-admin')
const processUtils = require('./process')
const teamUtils = require('./team')

module.exports = {

  createMessage:(team,user,text,image,action,linkTeamObj,linkUserObj,donor,donorMessage,process)=> {
    const now=Date.now();
    return admin.firestore().doc('PERRINNTeams/'+user).get().then(userData=>{
      return admin.database().ref('teamMessages/'+team).push({
        payload:{
          timestamp:now,
          text:text,
          user:user,
          name:userData.data().name,
          imageUrlThumbUser:userData.data().imageUrlThumb,
          image:image,
          action:action,
          linkTeam: linkTeamObj.key ? linkTeamObj.key : null,
          linkTeamName: linkTeamObj.name ? linkTeamObj.name : null,
          linkTeamImageUrlThumb: linkTeamObj.imageUrlThumb ? linkTeamObj.imageUrlThumb : null,
          linkUser: linkUserObj.key ? linkUserObj.key : null,
          linkUserName: linkUserObj.name ? linkUserObj.name : null,
          linkuserFamilyName: linkUserObj.familyName ? linkUserObj.familyName : null,
          linkUserImageUrlThumb: linkUserObj.imageUrlThumb ? linkUserObj.imageUrlThumb : null,
        },
        PERRINN:{transactionIn:{donor:donor,donorMessage:donorMessage}},
        process:process,
      });
    }).catch(error=>{
      console.log(error);
      return error;
    });
  },

  createMessageAFS:(messageObj)=>{
    return admin.firestore().collection('IDs').add({
      user:messageObj.user,
      serverTimestamp: admin.firestore.FieldValue.serverTimestamp()
    }).then(ref=>{
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
          return admin.firestore().collection('PERRINNMessages').add(messageObj);
        });
      });
    }).catch(error=>{
      console.log(error);
      return error;
    });
  },

}
