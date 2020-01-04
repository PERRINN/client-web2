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

  createMessageAFS:(user,text,image,imageDownloadURL,chatSubject,chain,recipients, recipientList)=>{
    const now = Date.now();
    return admin.firestore().doc('PERRINNTeams/'+user).get().then(userData=>{
      return admin.firestore().collection('PERRINNMessages').add({
        timestamp:now,
        serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        chatSubject:chatSubject,
        chain:chain,
        recipients:recipients,
        recipientList:recipientList,
        emailNotifications:recipientList,
        lastMessage: true,
        user:user,
        name:userData.data().name,
        imageUrlThumbUser:userData.data().imageUrlThumb,
        text:text,
        image:image,
        imageDownloadURL:imageDownloadURL
      });
    }).catch(error=>{
      console.log(error);
      return error;
    });
  },

}
