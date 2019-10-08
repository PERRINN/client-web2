const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const createMessageUtils = require('../../utils/createMessage')

exports=module.exports=functions.firestore.document('PERRINNTeams/{team}').onCreate((data,context)=>{
  let teamObj=data.data();
  teamObj.key=context.params.team;
  return admin.database().ref('appSettings/specialImages/newTeam').once('value').then(image=>{
    return admin.database().ref('subscribeImageTeams/'+image.val()).update({
      [context.params.team]:true,
    }).then(()=>{
      return createMessageUtils.createMessage ('-L7jqFf8OuGlZrfEK6dT',"PERRINN","New team:","","",{},teamObj,'none','none',{});
    }).then(()=>{
      let text="Welcome to PERRINN, we are happy to have you here with us! If you have any question please ask here. We will be happy to help.";
      let recipientList=['-L7jqFf8OuGlZrfEK6dT','QYm5NATKa6MGD87UpNZCTl6IolX2',teamObj.key];
      let recipientNameList=['Admin','Nicolas',teamObj.name];
      let recipientIndex='';
      recipientList=recipientList.sort();
      recipientList.forEach(recipient=>{
        recipientIndex=recipientIndex+recipient;
      });
      return createMessageUtils.createMessageAFS ('-L7jqFf8OuGlZrfEK6dT',text,"","",recipientIndex,recipientList,recipientNameList);
    });
  });
});
