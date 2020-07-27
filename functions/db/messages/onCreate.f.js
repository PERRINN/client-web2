const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const createMessageUtils = require('../../utils/createMessage')
const customClaimsUtils = require('../../utils/customClaims')
const childTopUpUtils = require('../../utils/childTopUp')
const emailUtils = require('../../utils/email')

exports=module.exports=functions.firestore.document('PERRINNMessages/{message}').onCreate(async(data,context)=>{
  const messageData=data.data();
  const process=messageData.process;
  const user=messageData.user;
  const message=context.params.message;
  let amountTransactionOut=0;
  let amountTransactionIn=0;
  let amountMessaging=0;
  let amountRead=0;
  let amountWrite=0;
  let donorCheckTransactionIn=false;
  let donor='none';
  let donorName='';
  let donorFamilyName='';
  let donorImageUrlThumb='';
  let receiverTransactionOut='none';
  let reference='none';
  let referenceTransactionOut='none';
  let receiverName='';
  let receiverFamilyName='';
  let receiverImageUrlThumb='';
  let receiverMessage='none';
  let inputCheckTransactionOut=false;
  let functionObj={none:'none'};
  let inputs={none:'none'};
  let inputsComplete=false;
  let receiverMessageObj={};
  let lastThreadMessageData={};
  let previousMessageData={};
  var batch = admin.firestore().batch();

  try{

    //last user message
    let previousMessage='none';
    const lastUserMessages=await admin.firestore().collection('PERRINNMessages').where('user','==',user).where('verified','==',true).orderBy('serverTimestamp','desc').limit(1).get()
    lastUserMessages.forEach(message=>{
      previousMessage=message.id;
      previousMessageData=message.data();
    });

    //last message flag
    const lastThreadMessages=await admin.firestore().collection('PERRINNMessages').where('chain','==',messageData.chain).where('lastMessage','==',true).get()
    lastThreadMessages.forEach(message=>{
      batch.update(admin.firestore().doc('PERRINNMessages/'+message.id),{lastMessage:false});
      lastThreadMessageData=message.data();
    });
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{lastMessage:true});

    //message chain data
    const userObj=await admin.firestore().doc('PERRINNTeams/'+user).get()
    let userData=userObj.data()||{}
    let index=((previousMessage.PERRINN||{}).chain||{}).index+1||userData.previousIndex+1||1;
    if(previousMessage!='none')batch.update(admin.firestore().doc('PERRINNMessages/'+previousMessage),{"PERRINN.chain.nextMessage":message||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.currentMessage":message||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.previousMessage":previousMessage||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.nextMessage":'none'},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.index":index||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{previousMessage:message||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{previousIndex:index||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{lock:admin.firestore.FieldValue.delete()||null},{create:true});

    //messaging cost
    const costs=await admin.firestore().doc('appSettings/costs').get()
    amountWrite=costs.data().messageWrite;
    amountMessaging=Math.round(Number(amountWrite)*100000)/100000;
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.amount":amountMessaging||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.amountWrite":amountWrite||null},{create:true});

    //message transaction out
    if(process!=undefined&&process!=null){
      if(process.function!=undefined&&process.function!=null){
        if(process.function.name=='transactionOut'){
          if(checkTransactionInputs(process.inputs)) {
            amountTransactionOut=process.inputs.amount;
            receiverTransactionOut=process.inputs.receiver;
            receiverName=process.inputs.receiverName;
            receiverFamilyName=process.inputs.receiverFamilyName;
            referenceTransactionOut=process.inputs.reference;
            inputCheckTransactionOut=true;
          }
        }
      }
    }
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.amount":amountTransactionOut||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.receiver":receiverTransactionOut||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.receiverName":receiverName||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.receiverFamilyName":receiverFamilyName||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.receiverImageUrlThumb":receiverImageUrlThumb||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.receiverMessage":receiverMessage||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.reference":referenceTransactionOut||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.inputCheck":inputCheckTransactionOut||null},{create:true});

    //message transaction in
    if(messageData.PERRINN!=undefined){
      let transactionInObj=messageData.PERRINN.transactionIn;
      if(transactionInObj!=undefined&&transactionInObj!=null){
        if(transactionInObj.donor!=undefined&&transactionInObj.donor!=null){
          donor=transactionInObj.donor;
          donorName=transactionInObj.donorName;
          donorFamilyName=transactionInObj.donorFamilyName;
          donorImageUrlThumb=transactionInObj.donorImageUrlThumb;
          amountTransactionIn=transactionInObj.amount;
          reference=transactionInObj.reference;
          donorCheckTransactionIn=true;
        }
      }
    }
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.amount":amountTransactionIn||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.donor":donor||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.donorName":donorName||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.donorFamilyName":donorFamilyName||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.donorImageUrlThumb":donorImageUrlThumb||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.reference":reference||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.donorCheck":donorCheckTransactionIn||null},{create:true});

    //message wallet
    var previousBalance=((previousMessageData.PERRINN||{}).wallet||{}).balance||userData.lastMessageBalance||0;
    var newBalance=previousBalance;
    if(amountMessaging>0){
      newBalance=Math.round((Number(newBalance)-Number(amountMessaging))*100000)/100000;
    }
    if(inputCheckTransactionOut){
      newBalance=Math.round((Number(newBalance)-Number(amountTransactionOut))*100000)/100000;
    }
    if(donorCheckTransactionIn){
      newBalance=Math.round((Number(newBalance)+Number(amountTransactionIn))*100000)/100000;
    }
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.wallet.previousBalance":previousBalance||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.wallet.balance":newBalance||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{lastMessageBalance:newBalance||null},{create:true});

    //email notifications
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.emailNotifications":messageData.recipientList||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{enableEmailNotifications:true||null},{create:true});

    //user data
    const now=Date.now();
    var nameLowerCase=(messageData.name||userData.name||'').toLowerCase()+' '+(messageData.familyName||userData.familyName||'').toLowerCase();
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{name:messageData.name||previousMessageData.name||userData.name||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{familyName:messageData.familyName||previousMessageData.familyName||userData.familyName||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{userImageTimestamp:messageData.userImageTimestamp||previousMessageData.userImageTimestamp||userData.imageTimestamp||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{imageUrlThumbUser:messageData.imageUrlThumbUser||previousMessageData.imageUrlThumbUser||userData.imageUrlThumb||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{imageUrlMedium:messageData.imageUrlMedium||previousMessageData.imageUrlMedium||userData.imageUrlMedium||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{imageUrlOriginal:messageData.imageUrlOriginal||previousMessageData.imageUrlOriginal||userData.imageUrlOriginal||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{createdTimestamp:previousMessageData.createdTimestamp||userData.createdTimestamp||now},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{searchName:nameLowerCase},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"apps.Google.enabled":((messageData.apps||{}).Google||{}).enabled||((userData.apps||{}).Google||{}).enabled||false},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"apps.Onshape.enabled":((messageData.apps||{}).Onshape||{}).enabled||((userData.apps||{}).Onshape||{}).enabled||false},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{name:messageData.name||userData.name||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{familyName:messageData.familyName||userData.familyName||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{imageTimestamp:messageData.userImageTimestamp||previousMessageData.userImageTimestamp||userData.imageTimestamp||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{imageUrlThumb:messageData.imageUrlThumbUser||userData.imageUrlThumb||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{imageUrlMedium:messageData.imageUrlMedium||userData.imageUrlMedium||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{imageUrlOriginal:messageData.imageUrlOriginal||userData.imageUrlOriginal||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{createdTimestamp:userData.createdTimestamp||now},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{searchName:nameLowerCase},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{members:{[user]:{name:messageData.name||userData.name||null,familyName:messageData.familyName||userData.familyName||null,leader:true}}},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{isUser:true},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{"apps.Google.enabled":((messageData.apps||{}).Google||{}).enabled||((userData.apps||{}).Google||{}).enabled||false},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{"apps.Onshape.enabled":((messageData.apps||{}).Onshape||{}).enabled||((userData.apps||{}).Onshape||{}).enabled||false},{create:true});
    if (((messageData.apps||{}).Google||{}).enabled)googleUtils.joinPERRINNGoogleGroup(user)
    if (((messageData.apps||{}).Onshape||{}).enabled)onshapeUtils.joinPERRINNOnshapeTeam(user)
    if(userData.createdTimestamp==undefined){
      let sender='-L7jqFf8OuGlZrfEK6dT';
      let messageObj={
        user:sender,
        domain:user,
        text:"Welcome to PERRINN, we are happy to have you here with us! If you have any question please ask here. We will be happy to help.",
        chatSubject:'Welcome to PERRINN',
        recipientList:[sender,'QYm5NATKa6MGD87UpNZCTl6IolX2',user]
      };
      await createMessageUtils.createMessageAFS(messageObj);
    }

    //message domain data
    const domainObj=await admin.firestore().doc('PERRINNTeams/'+messageData.domain).get()
    let domainData=domainObj.data()||{}
    var nameLowerCase=(messageData.domainName||previousMessageData.domainName||domainData.name||'').toLowerCase();
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{domainName:messageData.domainName||previousMessageData.domainName||domainData.name||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{domainImageTimestamp:messageData.domainImageTimestamp||previousMessageData.domainImageTimestamp||domainData.imageTimestamp||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{domainImageUrlThumb:messageData.domainImageUrlThumb||previousMessageData.domainImageUrlThumb||domainData.imageUrlThumb||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{domainImageUrlMedium:messageData.domainImageUrlMedium||previousMessageData.domainImageUrlMedium||domainData.imageUrlMedium||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{domainImageUrlOriginal:messageData.domainImageUrlOriginal||previousMessageData.domainImageUrlOriginal||domainData.imageUrlOriginal||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{domainMembershipCost:messageData.domainMembershipCost||previousMessageData.domainMembershipCost||domainData.membershipCost||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{domainSearchName:nameLowerCase},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{[`members.${messageData.user}.name`]:messageData.name||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{[`members.${messageData.user}.familyName`]:messageData.familyName||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{[`members.${messageData.user}.imageUrlThumb`]:messageData.imageUrlThumbUser||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{name:messageData.domainName||previousMessageData.domainName||domainData.name||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{imageTimestamp:messageData.domainImageTimestamp||previousMessageData.domainImageTimestamp||domainData.imageTimestamp||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{imageUrlThumb:messageData.domainImageUrlThumb||previousMessageData.domainImageUrlThumb||domainData.imageUrlThumb||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{imageUrlMedium:messageData.domainImageUrlMedium||previousMessageData.domainImageUrlMedium||domainData.imageUrlMedium||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{imageUrlOriginal:messageData.domainImageUrlOriginal||previousMessageData.domainImageUrlOriginal||domainData.imageUrlOriginal||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{membershipCost:messageData.domainMembershipCost||previousMessageData.domainMembershipCost||domainData.membershipCost||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{searchName:nameLowerCase},{create:true});

    //message transaction receiver
    if(amountTransactionOut>0){
      receiverMessageObj={
        domain:messageData.domain,
        user:receiverTransactionOut,
        text:amountTransactionOut+" COINS received, reference: "+referenceTransactionOut,
        chain:messageData.chain,
        chatSubject:messageData.chatSubject,
        recipientList:messageData.recipientList,
        PERRINN:{
          transactionIn:{
            donor:user,
            donorName:messageData.name,
            donorFamilyName:messageData.familyName,
            donorImageUrlThumb:messageData.imageUrlThumbUser,
            amount:amountTransactionOut,
            reference:referenceTransactionOut
          }
        }
      };
    }

    //message recipients data
    var reads=[];
    messageData.recipientList.forEach(recipient=>{
      reads.push(admin.firestore().doc('PERRINNTeams/'+recipient).get());
    });
    const recipientsObj=await Promise.all(reads)
    messageData.recipientList.forEach((recipient,index)=>{
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{[`recipients.${recipient}.name`]:(recipientsObj[index].data()||{}).name||null},{create:true});
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{[`recipients.${recipient}.familyName`]:(recipientsObj[index].data()||{}).familyName||null},{create:true});
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{[`recipients.${recipient}.imageUrlThumb`]:(recipientsObj[index].data()||{}).imageUrlThumb||null},{create:true});
    });

    //message chat Subject
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{chatSubject:messageData.chatSubject||lastThreadMessageData.chatSubject||null},{create:true})

    //message verified
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{verified:true},{create:true})

    await batch.commit()
    if(receiverMessageObj.PERRINN!=undefined)await createMessageUtils.createMessageAFS(receiverMessageObj)
    await childTopUpUtils.performChildTopUp(user)
    await customClaimsUtils.setCustomClaims(user)
  }
  catch(error){
    console.log(error);
    emailUtils.sendErrorEmail(error);
    return admin.firestore().doc('PERRINNMessages/'+message).update({verified:false})
  }
});


function checkTransactionInputs(inputs) {
  if(inputs.amount>0&&inputs.amount<=100000){
    if(inputs.reference!=''){
      return true;
    }
  }
  return false;
}
