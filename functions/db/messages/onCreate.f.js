const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const createMessageUtils = require('../../utils/createMessage')
const customClaimsUtils = require('../../utils/customClaims')
const childTopUpUtils = require('../../utils/childTopUp')
const emailUtils = require('../../utils/email')
const processUtils = require('../../utils/process')

exports=module.exports=functions.firestore.document('PERRINNMessages/{message}').onCreate(async (data,context)=>{
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
  let lastMessageData={};
  var batch = admin.firestore().batch();

  try {
    await admin.firestore().runTransaction(async transaction => {
      const chain=await transaction.get(admin.firestore().doc('PERRINNTeams/'+user))
      if (chain.exists) {
        if(chain.data().lock)return Promise.reject();
      }
      transaction.update(admin.firestore().doc('PERRINNTeams/'+user),{lock:true||null},{create:true});
    })

    //message chain data
    const userObj=await admin.firestore().doc('PERRINNTeams/'+user).get()
    let userData=userObj.data()||{}
    let previousMessage=userData.previousMessage||'none';
    let index=Number(userData.previousIndex)+1||1;
    const domainObj=await admin.firestore().doc('PERRINNTeams/'+messageData.domain).get()
    let domainData=domainObj.data()||{}
    const lastMessages=await admin.firestore().collection('PERRINNMessages').where('chain','==',messageData.chain).where('lastMessage','==',true).get()
    const costs=await admin.firestore().doc('appSettings/costs').get()
    if(previousMessage!='none')batch.update(admin.firestore().doc('PERRINNMessages/'+previousMessage),{"PERRINN.chain.nextMessage":message||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.currentMessage":message||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.previousMessage":previousMessage||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.nextMessage":'none'||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.index":index||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.timestamp":admin.firestore.FieldValue.serverTimestamp()||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{previousMessage:message||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{previousIndex:index||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{lock:admin.firestore.FieldValue.delete()||null},{create:true});

    //last message flag
    lastMessages.forEach(message=>{
      batch.update(admin.firestore().doc('PERRINNMessages/'+message.id),{lastMessage:false});
      lastMessageData=message.data();
    });
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{lastMessage:true});

    //messaging cost
    amountWrite=costs.data().messageWrite;
    amountMessaging=Math.round(Number(amountWrite)*100000)/100000;
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.amount":amountMessaging||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.amountWrite":amountWrite||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.timestamp":admin.firestore.FieldValue.serverTimestamp()||null},{create:true});

    //message process
    if(process!=undefined&&process!=null){
      if(process.inputsComplete){
        functionObj=process.function;
        if(process.inputs!=undefined) inputs=process.inputs;
        inputsComplete=process.inputsComplete;
      }
    }
    const result=await processUtils.executeProcess(user,functionObj,inputs,message)
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.process.function":functionObj||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.process.inputs":inputs||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.process.inputsComplete":inputsComplete||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.process.result":result||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.process.timestamp":admin.firestore.FieldValue.serverTimestamp()||null},{create:true});

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
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.timestamp":admin.firestore.FieldValue.serverTimestamp()||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.inputCheck":inputCheckTransactionOut||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.process.result":'done'||null},{create:true});

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
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.timestamp":admin.firestore.FieldValue.serverTimestamp()||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.donorCheck":donorCheckTransactionIn||null},{create:true});

    //message wallet
    var previousBalance=userData.lastMessageBalance||0;
    var balance=previousBalance;
    if(amountMessaging>0){
      balance=Math.round((Number(balance)-Number(amountMessaging))*100000)/100000;
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.status":'complete'||null},{create:true});
    } else {
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.status":'none'||null},{create:true});
    }
    if(inputCheckTransactionOut){
      balance=Math.round((Number(balance)-Number(amountTransactionOut))*100000)/100000;
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.status":'complete'||null},{create:true});
    } else {
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.status":'none'||null},{create:true});
    }
    if(donorCheckTransactionIn){
      balance=Math.round((Number(balance)+Number(amountTransactionIn))*100000)/100000;
    }
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.wallet.previousBalance":previousBalance||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.wallet.amount":Math.round((balance-previousBalance)*100000)/100000||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.wallet.balance":balance||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.wallet.timestamp":admin.firestore.FieldValue.serverTimestamp()||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{lastMessageBalance:balance||null},{create:true});

    //email notifications
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.emailNotifications":messageData.recipientList||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{enableEmailNotifications:true||null},{create:true});

    //user data
    const now=Date.now();
    var nameLowerCase=(messageData.name||userData.name||'').toLowerCase()+' '+(messageData.familyName||userData.familyName||'').toLowerCase();
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{name:messageData.name||userData.name||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{familyName:messageData.familyName||userData.familyName||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{imageUrlThumbUser:messageData.imageUrlThumbUser||userData.imageUrlThumb||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"apps.Google.enabled":((messageData.apps||{}).Google||{}).enabled||userData.apps.Google.enabled||false},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"apps.Onshape.enabled":((messageData.apps||{}).Onshape||{}).enabled||userData.apps.Onshape.enabled||false},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{name:messageData.name||userData.name||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{familyName:messageData.familyName||userData.familyName||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{imageUrlThumb:messageData.imageUrlThumbUser||userData.imageUrlThumb||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{imageUrlMedium:messageData.imageUrlMedium||userData.imageUrlMedium||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{imageUrlOriginal:messageData.imageUrlOriginal||userData.imageUrlOriginal||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{createdTimestamp:userData.createdTimestamp||now},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{searchName:nameLowerCase},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{members:{[user]:{name:messageData.name||userData.name||null,familyName:messageData.familyName||userData.familyName||null,leader:true,timestamp:admin.firestore.FieldValue.serverTimestamp()}}},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{isUser:true},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{"apps.Google.enabled":((messageData.apps||{}).Google||{}).enabled||userData.apps.Google.enabled||false},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{"apps.Onshape.enabled":((messageData.apps||{}).Onshape||{}).enabled||userData.apps.Onshape.enabled||false},{create:true});
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
    var nameLowerCase=(messageData.domainName||domainData.name||'').toLowerCase()+' '+(messageData.domainFamilyName||domainData.familyName||'').toLowerCase();
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{domainName:messageData.domainName||domainData.name||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{domainFamilyName:messageData.domainFamilyName||domainData.familyName||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{domainImageTimestamp:messageData.domainImageTimestamp||domainData.imageTimestamp||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{domainImageUrlOriginal:messageData.domainImageUrlOriginal||domainData.imageUrlOriginal||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{membershipCost:messageData.membershipCost||domainData.membershipCost||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{[`members.${messageData.user}.name`]:messageData.name||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{[`members.${messageData.user}.familyName`]:messageData.familyName||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{[`members.${messageData.user}.imageUrlThumb`]:messageData.imageUrlThumbUser||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{name:messageData.domainName||domainData.name||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{familyName:messageData.domainFamilyName||domainData.familyName||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{imageTimestamp:messageData.domainImageTimestamp||domainData.imageTimestamp||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{imageUrlOriginal:messageData.domainImageUrlOriginal||domainData.imageUrlOriginal||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{searchName:nameLowerCase},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{membershipCost:messageData.membershipCost||domainData.membershipCost||null},{create:true});

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
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{chatSubject:messageData.chatSubject||lastMessageData.chatSubject||null},{create:true})

    await batch.commit()
    if(receiverMessageObj.PERRINN!=undefined)await createMessageUtils.createMessageAFS(receiverMessageObj)
    await childTopUpUtils.performChildTopUp(user)
    await customClaimsUtils.setCustomClaims(user)
  }
  catch (error) {
    console.log(error);
    emailUtils.sendErrorEmail(error);
    return admin.firestore().doc('PERRINNTeams/'+user).update({lock:admin.firestore.FieldValue.delete()});
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
